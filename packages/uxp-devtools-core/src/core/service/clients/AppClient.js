/* eslint-disable camelcase */
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

const Client = require("./Client");
const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");

const LOAD_TIMEOUT = 5000;
const REFRESH_LIST_TIMEOUT = 1500;
const SANDBOX_UDT_PLUGINS_WORKSPACE = "UDTPlugins";

function fetchPluginIdFromManifest(pluginPath) {
    const manifestPath = path.join(pluginPath, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
        return null;
    }
    const contents = fs.readFileSync(manifestPath, "utf8");
    const manifestJson = JSON.parse(contents);
    return manifestJson.id;
}

class AppSandboxHelper {
    constructor(appInfo) {
        this._appInfo = appInfo;
    }

    _getSandboxUDTPluginsWorkspacePath() {
        const storagePath = path.join(this._appInfo.sandboxStoragePath, SANDBOX_UDT_PLUGINS_WORKSPACE);
        return storagePath;
    }

    getSandboxPluginPath(pluginSourcePath, pluginId) {
        const loadedPluginPath = path.normalize(pluginSourcePath);
        const pluginDirName = path.basename(loadedPluginPath) + "_" + pluginId;
        const sandboxStoragePath = this._getSandboxUDTPluginsWorkspacePath();
        const sandboxPluginPath = path.join(sandboxStoragePath, pluginDirName);
        return sandboxPluginPath;
    }

    copyPluginInSandboxStorage(sandboxStoragePath, pluginSource, callback) {
        try {
            fs.ensureDirSync(sandboxStoragePath);
            fs.copySync(pluginSource, sandboxStoragePath);
            return true;
        }
        catch (err) {
            UxpLogger.error(`Error copying plugin to sandbox storage ${err}`);
            const reply = {
                error: "Failed to copy plugin contents." + err,
                command: "reply"
            };
            callback(null, reply);
            return false;
        }
    }

    createMessageWithSandboxStoragePath(message) {
        const { params } = message;
        if (!(params && params.provider && params.provider.path)) {
            return message;
        }

        const pluginId = fetchPluginIdFromManifest(message.params.provider.path);
        let sandboxPluginRequestMessage = _.cloneDeep(message);
        const newPluginPath = this.getSandboxPluginPath(params.provider.path, pluginId);
        sandboxPluginRequestMessage.params.provider.path = newPluginPath;
        return sandboxPluginRequestMessage;
    }

    cleanupSandboxStorageData() {
        if (!this._appInfo.sandbox) {
            return;
        }

        const storagePath = this._getSandboxUDTPluginsWorkspacePath();
        fs.emptydirSync(storagePath);
    }

}

class AppClient extends Client {
    // eslint-disable-next-line class-methods-use-this
    get type() {
        return "app";
    }

    constructor(server, socket) {
        super(server, socket);
        this.isInitialized = false;
        this.platform = null;
        this.baseProductionFolderPaths = [];
        // Send a ready message to unblock the inspector.
        this.send({
            command: "ready",
        });
    }

    _ensureAppSandboxHelper() {
        if (!this.appSandboxHelper) {
            this.appSandboxHelper = new AppSandboxHelper(this.appInfo);
        }
        return this.appSandboxHelper;
    }

    _getPluginForMessage(message) {
        const { pluginSessionId } = message;
        return this._server.pluginSessionMgr.getPluginFromHostSessionId(pluginSessionId);
    }

    _getCDTClientForMessage(message) {
        const plugin = this._getPluginForMessage(message);
        if (!plugin) {
            return null;
        }
        return plugin.getCDTClient();
    }

    _handlePluginUnloadCommon(plugin) {
        // this plugin was unloaded at the uxp side -
        // so, end the debugging session with Inspect, if any.
        const cdtClient = plugin.getCDTClient();
        if (cdtClient) {
            cdtClient.handleHostPluginUnloaded();
        }
        // remove this plugin from session manager.
        this._server.pluginSessionMgr.removePlugin(plugin);
        this._server.broadcastEvent("didPluginUnloaded", plugin);
    }

    _handleHostAppLog(msg) {
        const { level, message } = msg;
        if (!(level && message && this.appInfo)) {
            return;
        }
        const { appId, appName, appVersion, uxpVersion } = this.appInfo;
        const data = { level, message, appInfo : { appId, appName, appVersion, uxpVersion } };
        this._server.broadcastEvent("hostAppLog", data);
    }

    msg_UXP(message) {
        if (message.action === "unloaded") {
            const plugin = this._getPluginForMessage(message);
            if (!plugin) {
                return;
            }
            this._handlePluginUnloadCommon(plugin);
        }
        else if (message.action === "log") {
            this._handleHostAppLog(message);
        }
    }

    msg_CDTBrowser(message) {
        if (this._browserCDTClient) {
            this._browserCDTClient.sendRaw(message.cdtMessage);
        }
    }

    msg_CDT(message) {
        const cdtClient = this._getCDTClientForMessage(message);
        if (!cdtClient) {
            return;
        }
        if (message.cdtMessage) {
            cdtClient.sendRaw(message.cdtMessage);
        }
    }

    handleDevToolsAppInfo(data) {
        this.appInfo = data;
        this.isInitialized = true;
        this.platform = data.platform;

        UxpLogger.verbose(`${this.appInfo.appId}(${this.appInfo.appVersion}) connected to service ... `);
        // Make sure that we send a notification when this client
        // is added.
        this._server.broadcastEvent("didAddRuntimeClient", this);
    }

    // eslint-disable-next-line class-methods-use-this
    msg_initRuntimeClient() {
        // ask for app info.
        const message = {
            command: "App",
            action: "info",
        };
        this.sendRequest(message, (err, reply) => {
            if (err) {
                UxpLogger.error(`WS Error while processing request for ${message.command} with error ${err}`);
                return;
            }
            this.handleDevToolsAppInfo(reply);
        });
    }

    _createMessageWithPluginSession(message, callback) {
        const clientSessionId = message.pluginSessionId;
        const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(clientSessionId);
        if (!plugin) {
            const reply = {
                error: "No valid session present at the CLI Service for given Plugin. Make sure you run `uxp plugin load` command first",
                command: "reply"
            };
            callback(null, reply);
            return null;
        }
        // get the host plugin session id for this plugin and send that to the host app.
        // eslint-disable-next-line no-param-reassign
        message.pluginSessionId = plugin.hostPlugInSessionId;
        return message;
    }

    _handlePluginDebugRequest(message, callback) {
        const clientSessionId = message.pluginSessionId;
        const msgWithSession = this._createMessageWithPluginSession(message, callback);
        if (!msgWithSession) {
            return;
        }

        const response = {
            command: "reply",
        };
        const wsServerUrl = this._server.localHostname;
        const cdtWSDebugUrl = `${wsServerUrl}/socket/cdt/${clientSessionId}`;
        response.wsdebugUrl = `ws=${cdtWSDebugUrl}`;
        response.chromeDevToolsUrl = `devtools://devtools/bundled/inspector.html?experiments=true&ws=${cdtWSDebugUrl}`;
        callback(null, response);
    }

    sendBrowserCDTMessage(cdtMessage) {
        const message = {
            command: "CDTBrowser",
            action: "cdtMessage",
            cdtMessage,
        };
        this.send(message);
    }

    handleBrowserCDTConnected(browserClient) {
        this._browserCDTClient = browserClient;
        const message = {
            command: "CDTBrowser",
            action: "cdtConnected",
        };
        this.sendRequest(message, (err, reply) => {
            if (reply.error) {
                UxpLogger.error(`Browser CDTConnected message failed with error ${reply.error}`);
            }
        });
    }

    handleBrowserCDTDisconnected() {
        this._browserCDTClient = null;
        const message = {
            command: "CDTBrowser",
            action: "cdtDisconnected",
        };
        this.sendRequest(message, (err, reply) => {
            if (reply.error) {
                UxpLogger.error(`Browser CDTConnected message failed with error ${reply.error}`);
            }
        });
    }
    _fetchInstalledPluginsList() {
        return new Promise((resolve) => {
            const discoverPluginsMessage = {
                command: "Plugin",
                action: "discover",
            };
            this.sendRequest(discoverPluginsMessage, (err, reply) => {
                if (err) {
                    UxpLogger.error(`Couldn't retrieve installed plugins from host application. ${err}`);
                    // Return empty list.
                    return resolve([]);
                }

                const { plugins } = reply;
                return resolve(plugins);
            });
        });
    }

    _fetchPluginsBaseFolderPaths() {
        if (this.baseProductionFolderPaths.length) {
            return Promise.resolve(this.baseProductionFolderPaths);
        }

        return this._fetchInstalledPluginsList().then((pluginsList) => {
            pluginsList.forEach(plugin => {
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

    _handlePluginLoadRequest(loadMessage, callback, existingClientSessionId = null) {
        const prom = this._fetchPluginsBaseFolderPaths();
        prom.then((installedPaths) => {
            this._verifyAndLoad(loadMessage, installedPaths, callback, existingClientSessionId);
        });
    }

    _handlePluginListRequest(message, callback) {
        const requestId = this.sendRequest(message, (err, reply) => {
            if (err) {
                callback(err, reply);
                return;
            }
            console.log(JSON.stringify(reply, null, 2));
            callback(err, reply);
        });
        this.handleRequestTimeout("refresh list", requestId, REFRESH_LIST_TIMEOUT);

    }

    _getPluginDetailsFromPluginSession(clientSessionId) {
        const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(clientSessionId);
        return plugin;
    }

    _isLoadedFromProductionFolder(message, baseFolderPaths) {
        if (!Array.isArray(baseFolderPaths) || baseFolderPaths.length === 0) {
            return false;
        }

        const { params } = message;
        if (!(params && params.provider && params.provider.path)) {
            return false;
        }

        const loadedPluginPath = path.normalize(params.provider.path);
        let isProductionPlugin = baseFolderPaths.find(path => (loadedPluginPath.indexOf(path) > -1));
        return !!isProductionPlugin;
    }

    _verifyAndLoad(message, baseFolderPaths, callback, existingClientSessionId) {
        if (this._isLoadedFromProductionFolder(message, baseFolderPaths)) {
            const reply = {
                error: "Failed to load plugin as loading and debugging of installed plugins is prohibited.",
                command: "reply"
            };
            callback(null, reply);
            return;
        }

        let updatedMessage = message;
        if (this.appInfo && this.appInfo.sandbox) {
            const sandboxHelperInstance = this._ensureAppSandboxHelper();
            updatedMessage = sandboxHelperInstance.createMessageWithSandboxStoragePath(message);
        }

        const pluginPath = message.params.provider.path;
        const pluginId = fetchPluginIdFromManifest(pluginPath);
        const requestId = this.sendRequest(updatedMessage, (err, reply) => {
            if (err) {
                callback(err, reply);
                return;
            }
            const { pluginSessionId } = reply;
            if (!pluginSessionId) {
                callback(null, reply);
                return;
            }
            // store the plugin session details - we try to restore the session back when the
            // app connects back again ( say, due to restart )
            const sessionMgr = this._server.pluginSessionMgr;
            const sessionId = sessionMgr.addPlugin(pluginId, pluginPath, pluginSessionId, this.appInfo, existingClientSessionId);
            const response = reply;
            response.pluginSessionId = sessionId;
            callback(err, response);
        });
        this.handleRequestTimeout("load", requestId, LOAD_TIMEOUT);
    }

    _handlePluginValidateRequest(message, callback) {
        let updatedMessage = message;
        if (this.appInfo && this.appInfo.sandbox) {
            const sandboxHelperInstance = this._ensureAppSandboxHelper();
            updatedMessage = sandboxHelperInstance.createMessageWithSandboxStoragePath(message);
            let success = sandboxHelperInstance.copyPluginInSandboxStorage(updatedMessage.params.provider.path, message.params.provider.path, callback);
            if (!success) {
                return;
            }
        }
        this.sendRequest(updatedMessage, callback);
    }

    _createLoadRequestForReloadRequest(plugin) {
        let loadMessage = {
            "command" : "Plugin",
            "action" : "load",
            "params" : {
                "provider" : {
                    "type" : "disk",
                    "id" : plugin.pluginId,
                    "path" : plugin.pluginPath
                }
            },
            "breakOnStart" : false,
        };
        return loadMessage;
    }

    _handlePluginReloadRequest(message, callback) {
        const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(message.pluginSessionId);
        if (!plugin) {
            const reply = {
                error: "No valid session present at the CLI Service for given Plugin. Make sure you run `uxp plugin load` command first",
                command: "reply"
            };
            callback(null, reply);
            return null;
        }

        if (this.appInfo && this.appInfo.sandbox) {
            const sandboxHelperInstance = this._ensureAppSandboxHelper();
            const sandboxPluginPath = sandboxHelperInstance.getSandboxPluginPath(plugin.pluginPath, plugin.pluginId);
            let success = sandboxHelperInstance.copyPluginInSandboxStorage(sandboxPluginPath, plugin.pluginPath, callback);
            if (!success) {
                return;
            }
        }

        const appInfo = plugin.appInfo;
        const featureConfig = this._server.featureConfigMgr.getConfigForHostApp(appInfo.appId, appInfo.appVersion);
        const isReloadSupported = featureConfig.isReloadSupported();
        if(!isReloadSupported) {
            const loadRequestMessage  = this._createLoadRequestForReloadRequest(plugin);
            this._handlePluginLoadRequest(loadRequestMessage, callback, message.pluginSessionId);
        }
        else {
            const msgWithSession = this._createMessageWithPluginSession(message, callback);
            if (msgWithSession) {
                this.sendRequest(msgWithSession, callback);
            }

        }
    }

    _handlePluginUnloadRequest(message, callback) {
        const msgWithSession = this._createMessageWithPluginSession(message, callback);
        if (!msgWithSession) {
            return;
        }
        this.sendRequest(msgWithSession, (err, reply) => {
            if (err) {
                callback(err, reply);
                return;
            }
            const plugin = this._getPluginForMessage(message);
            if (plugin) {
                this._handlePluginUnloadCommon(plugin);
            }
            // eslint-disable-next-line no-param-reassign
            // ToDo (@hkhurana) Cleanup sandbox storage data for UWP on unload.
            reply.pluginSessionId = message.pluginSessionId;
            callback(null, reply);
        });
    }

    handler_Plugin(message, callback) {
        const { action } = message;
        if (action === "load") {
            this._handlePluginLoadRequest(message, callback);
        }
        else if (action === "list") {
            this._handlePluginListRequest(message, callback);
        }
        else if (action === "debug") {
            this._handlePluginDebugRequest(message, callback);
        }
        else if (action === "unload") {
            this._handlePluginUnloadRequest(message, callback);
        }
        else if (action == "validate") {
            this._handlePluginValidateRequest(message, callback);
        }
        else if (action == "reload") {
            this._handlePluginReloadRequest(message, callback);
        }
        else {
            const msgWithSession = this._createMessageWithPluginSession(message, callback);
            if (msgWithSession) {
                this.sendRequest(msgWithSession, callback);
            }
        }
    }

    sendCDTMessage(cdtMessage, hostPluginSessionId) {
        const message = {
            command: "CDT",
            pluginSessionId: hostPluginSessionId,
            cdtMessage,
        };
        this.send(message);
    }

    handlePluginCDTConnected(hostPluginSessionId) {
        const message = {
            command: "Plugin",
            action: "cdtConnected",
            pluginSessionId: hostPluginSessionId,
        };
        this.sendRequest(message, (err, reply) => {
            if (reply.error) {
                UxpLogger.error(`Plugin CDTConnected message failed with error ${reply.error}`);
            }
        });
    }

    handlePluginCDTDisconnected(hostPluginSessionId) {
        const message = {
            command: "Plugin",
            action: "cdtDisconnected",
            pluginSessionId: hostPluginSessionId,
        };
        this.sendRequest(message, (err, reply) => {
            if (reply.error) {
                UxpLogger.error(`Plugin CDTDisconnected message failed with error ${reply.error}`);
            }
        });
    }

    on_UDTAppQuit() {
        if (this.appInfo && this.appInfo.sandbox) {
            this._ensureAppSandboxHelper().cleanupSandboxStorageData();
        }
    }

    handleDisconnect() {
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

module.exports = AppClient;
