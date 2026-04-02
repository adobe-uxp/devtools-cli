/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

import type { WebSocket } from 'ws';
import type {
  AppInfo,
  BaseMessage,
  CDTBrowserMessage,
  CDTMessage,
  PluginMessage,
  PluginMessageAny,
  RequestCallback,
  UXPMessage,
} from '../../../types/index.js';
import type { Server } from './Client.js';
import fs from 'node:fs';
import path from 'node:path';
import { cloneDeep } from 'lodash-es';
import Client from './Client.js';

// Forward declarations for CDTClient types
interface CDTClientInterface {
  sendRaw: (data: string) => void;
  handleHostPluginUnloaded: () => void;
}

interface BrowserCDTClientInterface {
  sendRaw: (data: string) => void;
}

// Plugin details interface
interface PluginDetails {
  pluginId: string;
  pluginPath: string;
  hostPlugInSessionId: string;
  appInfo: AppInfo;
  getCDTClients: () => Set<CDTClientInterface>;
}

interface PluginReplyMessage extends BaseMessage {
  pluginSessionId?: string;
  wsdebugUrl?: string;
  chromeDevToolsUrl?: string;
  plugins?: Array<{ path?: string }>;
}

const LOAD_TIMEOUT = 5000;
const REFRESH_LIST_TIMEOUT = 1500;
const SANDBOX_UDT_PLUGINS_WORKSPACE = 'UDTPlugins';

function fetchPluginIdFromManifest(pluginPath: string): string | null {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  const contents = fs.readFileSync(manifestPath, 'utf8');
  const manifestJson = JSON.parse(contents) as { id: string };
  return manifestJson.id;
}

class AppSandboxHelper {
  private _appInfo: AppInfo;

  constructor(appInfo: AppInfo) {
    this._appInfo = appInfo;
  }

  private _getSandboxUDTPluginsWorkspacePath(): string {
    const storagePath = path.join(this._appInfo.sandboxStoragePath || '', SANDBOX_UDT_PLUGINS_WORKSPACE);
    return storagePath;
  }

  getSandboxPluginPath(pluginSourcePath: string, pluginId: string): string {
    const loadedPluginPath = path.normalize(pluginSourcePath);
    const pluginDirName = `${path.basename(loadedPluginPath)}_${pluginId}`;
    const sandboxStoragePath = this._getSandboxUDTPluginsWorkspacePath();
    const sandboxPluginPath = path.join(sandboxStoragePath, pluginDirName);
    return sandboxPluginPath;
  }

  copyPluginInSandboxStorage(sandboxStoragePath: string, pluginSource: string, callback: RequestCallback): boolean {
    try {
      fs.mkdirSync(sandboxStoragePath, { recursive: true });
      fs.cpSync(pluginSource, sandboxStoragePath, { recursive: true });
      return true;
    }
    catch (err) {
      UxpLogger.error(`Error copying plugin to sandbox storage ${err}`);
      const reply: BaseMessage = {
        error: `Failed to copy plugin contents.${err}`,
        command: 'reply',
      };
      callback(null, reply);
      return false;
    }
  }

  createMessageWithSandboxStoragePath(message: PluginMessageAny): PluginMessageAny {
    const { params } = message;
    if (!(params && params.provider && params.provider.path)) {
      return message;
    }

    const pluginId = fetchPluginIdFromManifest(message.params!.provider!.path!);
    const sandboxPluginRequestMessage = cloneDeep(message);
    const newPluginPath = this.getSandboxPluginPath(params.provider.path!, pluginId || '');
    sandboxPluginRequestMessage.params!.provider!.path = newPluginPath;
    return sandboxPluginRequestMessage;
  }

  cleanupSandboxStorageData(): void {
    if (!this._appInfo.sandbox) {
      return;
    }

    const storagePath = this._getSandboxUDTPluginsWorkspacePath();
    fs.rmSync(storagePath, { recursive: true, force: true });
    fs.mkdirSync(storagePath, { recursive: true });
  }
}

class AppClient extends Client {
  public isInitialized: boolean;
  public platform: string | null;
  public baseProductionFolderPaths: string[];
  public appInfo!: AppInfo;
  private appSandboxHelper?: AppSandboxHelper;
  private _browserCDTClient: BrowserCDTClientInterface | null = null;

  override get type(): string {
    return 'app';
  }

  constructor(server: Server, socket: WebSocket | null) {
    super(server, socket);
    this.isInitialized = false;
    this.platform = null;
    this.baseProductionFolderPaths = [];
    // Send a ready message to unblock the inspector.
    this.send({
      command: 'ready',
    });
  }

  private _ensureAppSandboxHelper(): AppSandboxHelper {
    if (!this.appSandboxHelper) {
      this.appSandboxHelper = new AppSandboxHelper(this.appInfo);
    }
    return this.appSandboxHelper;
  }

  private _getPluginForMessage(message: BaseMessage & { pluginSessionId?: string }): PluginDetails | null {
    const { pluginSessionId } = message;
    if (!pluginSessionId) {
      return null;
    }
    return this._server.pluginSessionMgr.getPluginFromHostSessionId(pluginSessionId) as PluginDetails | null;
  }

  private _getCDTClientsForMessage(message: BaseMessage & { pluginSessionId?: string }): Set<CDTClientInterface> | null {
    const plugin = this._getPluginForMessage(message);
    if (!plugin) {
      return null;
    }
    return plugin.getCDTClients();
  }

  private _handlePluginUnloadCommon(plugin: PluginDetails): void {
    // this plugin was unloaded at the uxp side -
    // so, end the debugging session with all connected CDT clients.
    const cdtClients = plugin.getCDTClients();
    for (const cdtClient of cdtClients) {
      cdtClient.handleHostPluginUnloaded();
    }
    // remove this plugin from session manager.
    this._server.pluginSessionMgr.removePlugin(plugin);
    this._server.broadcastEvent('didPluginUnloaded', plugin);
  }

  msg_UXP(message: UXPMessage): void {
    if (message.action === 'unloaded') {
      const plugin = this._getPluginForMessage(message);
      if (!plugin) {
        return;
      }
      this._handlePluginUnloadCommon(plugin);
    }
    else if (message.action === 'log') {
      const { level, message: logMessage } = message;
      if (!(level && logMessage && this.appInfo)) {
        return;
      }
      const { appId, appName, appVersion, uxpVersion } = this.appInfo;
      const data = { level, message: logMessage, appInfo: { appId, appName, appVersion, uxpVersion } };
      this._server.broadcastEvent('hostAppLog', data);
    }
  }

  msg_CDTBrowser(message: CDTBrowserMessage): void {
    if (message.action === 'cdtMessage' && this._browserCDTClient) {
      this._browserCDTClient.sendRaw(message.cdtMessage);
    }
  }

  msg_CDT(message: CDTMessage): void {
    const cdtClients = this._getCDTClientsForMessage(message);
    if (!cdtClients || cdtClients.size === 0) {
      return;
    }
    if (message.cdtMessage) {
      // Broadcast CDP messages (responses + events) to ALL connected CDT clients.
      // Each client's CDP library ignores responses to request IDs it didn't send.
      for (const cdtClient of cdtClients) {
        cdtClient.sendRaw(message.cdtMessage);
      }
    }
  }

  handleDevToolsAppInfo(data: AppInfo): void {
    this.appInfo = data;
    this.isInitialized = true;
    this.platform = data.platform || null;

    UxpLogger.verbose(`${this.appInfo.appId}(${this.appInfo.appVersion}) connected to service ... `);
    // Make sure that we send a notification when this client
    // is added.
    this._server.broadcastEvent('didAddRuntimeClient', this);
  }

  msg_initRuntimeClient(): void {
    // ask for app info.
    const message: BaseMessage = {
      command: 'App',
    };
    const messageWithAction = { ...message, action: 'info' };
    this.sendRequest(messageWithAction, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        UxpLogger.error(`WS Error while processing request for ${message.command} with error ${err}`);
        return;
      }
      this.handleDevToolsAppInfo(reply as unknown as AppInfo);
    });
  }

  private _createMessageWithPluginSession(message: PluginMessageAny, callback: RequestCallback): PluginMessageAny | null {
    const clientSessionId = message.pluginSessionId;
    if (!clientSessionId) {
      const reply: BaseMessage = {
        error: 'No valid session present at the CLI Service for given Plugin. Make sure you run `uxp plugin load` command first',
        command: 'reply',
      };
      callback(null, reply);
      return null;
    }
    const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(clientSessionId) as PluginDetails | null;
    if (!plugin) {
      const reply: BaseMessage = {
        error: 'No valid session present at the CLI Service for given Plugin. Make sure you run `uxp plugin load` command first',
        command: 'reply',
      };
      callback(null, reply);
      return null;
    }
    // get the host plugin session id for this plugin and send that to the host app.

    message.pluginSessionId = plugin.hostPlugInSessionId;
    return message;
  }

  private _handlePluginDebugRequest(message: PluginMessageAny, callback: RequestCallback): void {
    const clientSessionId = message.pluginSessionId;
    const msgWithSession = this._createMessageWithPluginSession(message, callback);
    if (!msgWithSession) {
      return;
    }

    const response: PluginReplyMessage = {
      command: 'reply',
    };
    const wsServerUrl = this._server.localHostname;
    const cdtWSDebugUrl = `${wsServerUrl}/socket/cdt/${clientSessionId}`;
    response.wsdebugUrl = `ws=${cdtWSDebugUrl}`;
    response.chromeDevToolsUrl = `devtools://devtools/bundled/inspector.html?experiments=true&ws=${cdtWSDebugUrl}`;
    callback(null, response);
  }

  sendBrowserCDTMessage(cdtMessage: string): void {
    const message: CDTBrowserMessage = {
      command: 'CDTBrowser',
      action: 'cdtMessage',
      cdtMessage,
    };
    this.send(message);
  }

  handleBrowserCDTConnected(browserClient: BrowserCDTClientInterface): void {
    this._browserCDTClient = browserClient;
    const message: CDTBrowserMessage = {
      command: 'CDTBrowser',
      action: 'cdtConnected',
    };
    this.sendRequest(message, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        UxpLogger.error(`Browser CDTConnected message failed with error ${err}`);
        return;
      }
      if (reply.error) {
        UxpLogger.error(`Browser CDTConnected message failed with error ${reply.error}`);
      }
    });
  }

  handleBrowserCDTDisconnected(): void {
    this._browserCDTClient = null;
    const message: CDTBrowserMessage = {
      command: 'CDTBrowser',
      action: 'cdtDisconnected',
    };
    this.sendRequest(message, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        UxpLogger.error(`Browser CDTDisconnected message failed with error ${err}`);
        return;
      }
      if (reply.error) {
        UxpLogger.error(`Browser CDTDisconnected message failed with error ${reply.error}`);
      }
    });
  }

  private _fetchInstalledPluginsList(): Promise<Array<{ path?: string }>> {
    return new Promise((resolve) => {
      const discoverPluginsMessage: PluginMessage = {
        command: 'Plugin',
        action: 'discover',
      };
      this.sendRequest(discoverPluginsMessage, (err: Error | null, reply: BaseMessage) => {
        if (err) {
          UxpLogger.error(`Couldn't retrieve installed plugins from host application. ${err}`);
          // Return empty list.
          return resolve([]);
        }

        const { plugins } = reply as PluginReplyMessage;
        return resolve(plugins || []);
      });
    });
  }

  private _fetchPluginsBaseFolderPaths(): Promise<string[]> {
    if (this.baseProductionFolderPaths.length) {
      return Promise.resolve(this.baseProductionFolderPaths);
    }

    return this._fetchInstalledPluginsList().then((pluginsList) => {
      pluginsList.forEach((plugin) => {
        if (plugin.path) {
          let baseDirPath = path.dirname(plugin.path);
          baseDirPath = path.normalize(baseDirPath);
          if (!this.baseProductionFolderPaths.includes(baseDirPath)) {
            this.baseProductionFolderPaths.push(baseDirPath);
          }
        }
      });

      return this.baseProductionFolderPaths;
    });
  }

  private _handlePluginLoadRequest(loadMessage: PluginMessageAny, callback: RequestCallback, existingClientSessionId: string | null = null): void {
    const prom = this._fetchPluginsBaseFolderPaths();
    prom.then((installedPaths) => {
      this._verifyAndLoad(loadMessage, installedPaths, callback, existingClientSessionId);
    });
  }

  private _handlePluginListRequest(message: PluginMessage, callback: RequestCallback): void {
    const requestId = this.sendRequest(message, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        callback(err, reply);
        return;
      }
      console.log(JSON.stringify(reply, null, 2));
      callback(err, reply);
    });
    this.handleRequestTimeout('refresh list', requestId, REFRESH_LIST_TIMEOUT);
  }

  private _getPluginDetailsFromPluginSession(clientSessionId: string): PluginDetails | null {
    const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(clientSessionId);
    return plugin as PluginDetails | null;
  }

  private _isLoadedFromProductionFolder(message: PluginMessageAny, baseFolderPaths: string[]): boolean {
    if (!Array.isArray(baseFolderPaths) || baseFolderPaths.length === 0) {
      return false;
    }

    const { params } = message;
    if (!(params && params.provider && params.provider.path)) {
      return false;
    }

    const loadedPluginPath = path.normalize(params.provider.path);
    const isProductionPlugin = baseFolderPaths.find(basePath => (loadedPluginPath.includes(basePath)));
    return !!isProductionPlugin;
  }

  private _verifyAndLoad(message: PluginMessageAny, baseFolderPaths: string[], callback: RequestCallback, existingClientSessionId: string | null): void {
    if (this._isLoadedFromProductionFolder(message, baseFolderPaths)) {
      const reply: BaseMessage = {
        error: 'Failed to load plugin as loading and debugging of installed plugins is prohibited.',
        command: 'reply',
      };
      callback(null, reply);
      return;
    }

    let updatedMessage = message;
    if (this.appInfo && this.appInfo.sandbox) {
      const sandboxHelperInstance = this._ensureAppSandboxHelper();
      updatedMessage = sandboxHelperInstance.createMessageWithSandboxStoragePath(message);
    }

    const pluginPath = message.params!.provider!.path!;
    const pluginId = fetchPluginIdFromManifest(pluginPath);
    const requestId = this.sendRequest(updatedMessage, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        callback(err, reply);
        return;
      }
      const replyWithSession = reply as PluginReplyMessage;
      const { pluginSessionId } = replyWithSession;
      if (!pluginSessionId) {
        callback(null, reply);
        return;
      }
      // store the plugin session details - we try to restore the session back when the
      // app connects back again ( say, due to restart )
      const sessionMgr = this._server.pluginSessionMgr;
      const sessionId = sessionMgr.addPlugin(pluginId || '', pluginPath, pluginSessionId, this.appInfo, existingClientSessionId);
      const response = reply as PluginReplyMessage;
      response.pluginSessionId = sessionId;
      callback(err, response);
    });
    this.handleRequestTimeout('load', requestId, LOAD_TIMEOUT);
  }

  private _handlePluginValidateRequest(message: PluginMessageAny, callback: RequestCallback): void {
    let updatedMessage = message;
    if (this.appInfo && this.appInfo.sandbox) {
      const sandboxHelperInstance = this._ensureAppSandboxHelper();
      updatedMessage = sandboxHelperInstance.createMessageWithSandboxStoragePath(message);
      const success = sandboxHelperInstance.copyPluginInSandboxStorage(updatedMessage.params!.provider!.path!, message.params!.provider!.path!, callback);
      if (!success) {
        return;
      }
    }
    this.sendRequest(updatedMessage, callback);
  }

  private _createLoadRequestForReloadRequest(plugin: PluginDetails): PluginMessageAny {
    const loadMessage: PluginMessageAny = {
      command: 'Plugin',
      action: 'load',
      params: {
        provider: {
          type: 'disk',
          id: plugin.pluginId,
          path: plugin.pluginPath,
        },
      },
      breakOnStart: false,
    };
    return loadMessage;
  }

  private _handlePluginReloadRequest(message: PluginMessageAny, callback: RequestCallback): void {
    const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(message.pluginSessionId || '') as PluginDetails | null;
    if (!plugin) {
      const reply: BaseMessage = {
        error: 'No valid session present at the CLI Service for given Plugin. Make sure you run `uxp plugin load` command first',
        command: 'reply',
      };
      callback(null, reply);
      return;
    }

    if (this.appInfo && this.appInfo.sandbox) {
      const sandboxHelperInstance = this._ensureAppSandboxHelper();
      const sandboxPluginPath = sandboxHelperInstance.getSandboxPluginPath(plugin.pluginPath, plugin.pluginId);
      const success = sandboxHelperInstance.copyPluginInSandboxStorage(sandboxPluginPath, plugin.pluginPath, callback);
      if (!success) {
        return;
      }
    }

    const appInfo = plugin.appInfo;
    const featureConfig = this._server.featureConfigMgr.getConfigForHostApp(appInfo.appId, appInfo.appVersion);
    const isReloadSupported = featureConfig.isReloadSupported();
    if (!isReloadSupported) {
      const loadRequestMessage = this._createLoadRequestForReloadRequest(plugin);
      this._handlePluginLoadRequest(loadRequestMessage, callback, message.pluginSessionId || null);
    }
    else {
      const msgWithSession = this._createMessageWithPluginSession(message, callback);
      if (msgWithSession) {
        this.sendRequest(msgWithSession, callback);
      }
    }
  }

  private _handlePluginUnloadRequest(message: PluginMessageAny, callback: RequestCallback): void {
    const msgWithSession = this._createMessageWithPluginSession(message, callback);
    if (!msgWithSession) {
      return;
    }
    this.sendRequest(msgWithSession, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        callback(err, reply);
        return;
      }
      const plugin = this._getPluginForMessage(message);
      if (plugin) {
        this._handlePluginUnloadCommon(plugin);
      }

      // ToDo (@hkhurana) Cleanup sandbox storage data for UWP on unload.
      const replyWithSession = reply as PluginReplyMessage;
      replyWithSession.pluginSessionId = message.pluginSessionId;
      callback(null, replyWithSession);
    });
  }

  handler_Plugin(message: PluginMessage, callback: RequestCallback): void {
    const { action } = message;
    const pluginMessage = message as PluginMessageAny;
    if (action === 'load') {
      this._handlePluginLoadRequest(pluginMessage, callback);
    }
    else if (action === 'list') {
      this._handlePluginListRequest(message, callback);
    }
    else if (action === 'debug') {
      this._handlePluginDebugRequest(pluginMessage, callback);
    }
    else if (action === 'unload') {
      this._handlePluginUnloadRequest(pluginMessage, callback);
    }
    else if (action === 'validate') {
      this._handlePluginValidateRequest(pluginMessage, callback);
    }
    else if (action === 'reload') {
      this._handlePluginReloadRequest(pluginMessage, callback);
    }
    else {
      const msgWithSession = this._createMessageWithPluginSession(pluginMessage, callback);
      if (msgWithSession) {
        this.sendRequest(msgWithSession, callback);
      }
    }
  }

  sendCDTMessage(cdtMessage: string, hostPluginSessionId: string): void {
    const message: CDTMessage = {
      command: 'CDT',
      pluginSessionId: hostPluginSessionId,
      cdtMessage,
    };
    this.send(message);
  }

  handlePluginCDTConnected(hostPluginSessionId: string): void {
    const message: PluginMessage = {
      command: 'Plugin',
      action: 'cdtConnected',
      pluginSessionId: hostPluginSessionId,
    };
    this.sendRequest(message, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        UxpLogger.error(`Plugin CDTConnected message failed with error ${err}`);
        return;
      }
      if (reply.error) {
        UxpLogger.error(`Plugin CDTConnected message failed with error ${reply.error}`);
      }
    });
  }

  handlePluginCDTDisconnected(hostPluginSessionId: string): void {
    const message: PluginMessage = {
      command: 'Plugin',
      action: 'cdtDisconnected',
      pluginSessionId: hostPluginSessionId,
    };
    this.sendRequest(message, (err: Error | null, reply: BaseMessage) => {
      if (err) {
        UxpLogger.error(`Plugin CDTDisconnected message failed with error ${err}`);
        return;
      }
      if (reply.error) {
        UxpLogger.error(`Plugin CDTDisconnected message failed with error ${reply.error}`);
      }
    });
  }

  on_UDTAppQuit(): void {
    if (this.appInfo && this.appInfo.sandbox) {
      this._ensureAppSandboxHelper().cleanupSandboxStorageData();
    }
  }

  override handleDisconnect(): void {
    const data = this.appInfo;
    if (data) {
      UxpLogger.verbose(`${this.appInfo.appId}(${this.appInfo.appVersion}) got disconnected from service.`);
      if (data.sandbox) {
        this._ensureAppSandboxHelper().cleanupSandboxStorageData();
      }
    }
    super.handleDisconnect();
  }
}

export default AppClient;
