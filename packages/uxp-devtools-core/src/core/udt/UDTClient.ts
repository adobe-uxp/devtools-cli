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

import type {
  AppConnectionListener,
  HostAppLogListener,
  PluginStateListener,
} from '../../types/apps.js';
import type { AppEndPoint } from '../../types/index.js';
import type {
  PluginDebugParams,
  PluginLoadParams,
  PluginPackageParams,
  PluginReloadParams,
  PluginTestParams,
  PluginUnloadParams,
  PluginValidateParams,
} from '../../types/plugins.js';
import type { DebugUrlInfo } from '../client/plugin/actions/PluginDebugCommand.js';
import type { PluginInfoResult } from '../client/plugin/actions/RefreshListCommand.js';
import type PluginSession from '../client/plugin/PluginSession.js';
import PluginMgr from '../client/PluginMgr.js';
import DevToolsMgr from '../common/DevToolsMgr.js';

function createDevtoolsMgrInstance(): DevToolsMgr {
  return new DevToolsMgr(false);
}

// Type for the command methods that can be called dynamically
type ClientCommand
  = | 'debugPlugin'
    | 'refreshList'
    | 'unloadPlugin'
    | 'loadPlugin'
    | 'reloadPlugin'
    | 'validatePluginManifest'
    | 'packagePlugin'
    | 'setupTest'
    | 'executeTest';

// Map of command names to their method signatures for type safety
interface ClientCommandMap {
  debugPlugin: (pluginSession: PluginSession, params: PluginDebugParams) => Promise<DebugUrlInfo[]>;
  refreshList: () => Promise<PluginInfoResult[]>;
  unloadPlugin: (pluginSession: PluginSession, params: PluginUnloadParams) => Promise<boolean>;
  loadPlugin: (params: PluginLoadParams) => Promise<PluginSession>;
  reloadPlugin: (pluginSession: PluginSession, params: PluginReloadParams) => Promise<boolean>;
  validatePluginManifest: (params: PluginValidateParams) => Promise<boolean>;
  packagePlugin: (params: PluginPackageParams) => Promise<string>;
  setupTest: (params: PluginTestParams) => Promise<void>;
  executeTest: (pluginSession: PluginSession, params: PluginTestParams) => Promise<void>;
}

class UxpDevToolsClient implements ClientCommandMap {
  private _servicePort?: number;
  private _pluginMgr: PluginMgr;
  private _devToolsMgr?: DevToolsMgr;

  constructor(servicePort?: number) {
    this._servicePort = servicePort;
    this._pluginMgr = new PluginMgr();
    if (!servicePort) {
      // only initialize when the service port is not know -
      // we are using devtools mgr mainly to discover the service port which is running
      // in another process - we discover the port details via Vulcan -
      // it might be the case that both server and client might be running in the same app -
      // so, in such cases - we should avoid initializing vulcan lib twice in the same process.
      this._devToolsMgr = createDevtoolsMgrInstance();
    }
  }

  registerAppConnectionsListener(listener: AppConnectionListener): void {
    this._pluginMgr.registerAppConnectionsListener(listener);
  }

  registerPluginStateListener(listener: PluginStateListener): void {
    this._pluginMgr.registerPluginStateListener(listener);
  }

  registerHostAppLogListener(listener: HostAppLogListener): void {
    this._pluginMgr.registerHostAppLogListener(listener);
  }

  connectedApps(): AppEndPoint[] {
    return this._pluginMgr.getConnectedApps();
  }

  /*
  Note: this is deprecated now - `apps list` command will display connected app - instead of supported.
  getAppsList() {
      if (!this._devToolsMgr) {
          return null;
      }
      return this._devToolsMgr.getAppsList();
  }
  */

  debugPlugin(pluginSession: PluginSession, params: PluginDebugParams): Promise<DebugUrlInfo[]> {
    return this._pluginMgr.debugPlugin(pluginSession, params);
  }

  refreshList(): Promise<PluginInfoResult[]> {
    return this._pluginMgr.refreshList();
  }

  unloadPlugin(pluginSession: PluginSession, params: PluginUnloadParams): Promise<boolean> {
    return this._pluginMgr.unloadPlugin(pluginSession, params);
  }

  loadPlugin(params: PluginLoadParams): Promise<PluginSession> {
    return this._pluginMgr.loadPlugin(params);
  }

  reloadPlugin(pluginSession: PluginSession, params: PluginReloadParams): Promise<boolean> {
    return this._pluginMgr.reloadPlugin(pluginSession, params);
  }

  validatePluginManifest(params: PluginValidateParams): Promise<boolean> {
    return this._pluginMgr.validatePluginManifest(params);
  }

  packagePlugin(params: PluginPackageParams): Promise<string> {
    return this._pluginMgr.packagePlugin(params);
  }

  setupTest(params: PluginTestParams): Promise<void> {
    return this._pluginMgr.setupPluginTest(params);
  }

  executeTest(pluginSession: PluginSession, params: PluginTestParams): Promise<void> {
    params.servicePort = this._servicePort;
    return this._pluginMgr.executePluginTest(pluginSession, params);
  }

  connect(): Promise<void> {
    const prom = this.getServicePort();
    return prom.then((port) => {
      this._servicePort = port;
      return this._pluginMgr.connectToService(port);
    });
  }

  // This can be used by host (eg: cli) which wans to run plugin commands to completion from start
  // this method takes care of peforming all the required initialization like conneting to
  // cli service executing the actual plugin command and performing the required clean-up -
  // like terminating connection to service and returning the command results.
  async executePluginCommand<T extends ClientCommand>(
    commandName: T,
    ...args: Parameters<ClientCommandMap[T]>
  ): Promise<ReturnType<ClientCommandMap[T]>> {
    if (!this[commandName]) {
      throw new Error(`Devtools client: ${commandName} - no such command supported`);
    }
    try {
      await this.connect();
      // execute the actual command using type assertion for dynamic dispatch
      const method = this[commandName] as (...args: unknown[]) => Promise<unknown>;
      const results = await method.apply(this, args);
      this.disconnect();
      return results as ReturnType<ClientCommandMap[T]>;
    }
    catch (err) {
      // perform post clean-up - like disconnecting from service.
      this.disconnect();
      throw err;
    }
  }

  getServicePort(): Promise<number> {
    // if the service port was provided during initialization - then just use that instead
    // of discovering the service port details.
    if (this._servicePort) {
      return Promise.resolve(this._servicePort);
    }
    if (this._devToolsMgr) {
      return this._devToolsMgr.discoverServicePort().then((port) => {
        if (port === null) {
          throw new Error('Cannot get the Service port details!');
        }
        return port;
      });
    }
    return Promise.reject(new Error('Cannot get the Service port details!'));
  }

  disconnect(): void {
    this._devToolsMgr?.terminate();
    this._pluginMgr.disconnect();
  }
}

export default UxpDevToolsClient;
