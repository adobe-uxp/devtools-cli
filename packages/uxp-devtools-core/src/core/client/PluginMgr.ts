/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the Licrrense for the specific language
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
  PluginLogParams,
  PluginPackageParams,
  PluginReloadParams,
  PluginTestParams,
  PluginUnloadParams,
  PluginValidateParams,
} from '../../types/plugins.js';
import type { DebugUrlInfo } from './plugin/actions/PluginDebugCommand.js';
import type { PluginInfoResult } from './plugin/actions/RefreshListCommand.js';
import CliClientMgr from './connection/CliClientController.js';
import PluginDebugCommand from './plugin/actions/PluginDebugCommand.js';
import PluginLoadCommand from './plugin/actions/PluginLoadCommand.js';
import PluginLogCommand from './plugin/actions/PluginLogCommand.js';
import PluginPackageCommand from './plugin/actions/PluginPackageCommand.js';
import PluginReloadCommand from './plugin/actions/PluginReloadCommand.js';

import PluginTestCommand from './plugin/actions/PluginTestCommand.js';
import PluginTestSetupCommand from './plugin/actions/PluginTestSetupCommand.js';
import PluginUnloadCommand from './plugin/actions/PluginUnloadCommand.js';
import PluginValidateCommand from './plugin/actions/PluginValidateCommand.js';
import RefreshListCommand from './plugin/actions/RefreshListCommand.js';
import PluginSession from './plugin/PluginSession.js';

class PluginMgr {
  _cliClientMgr: CliClientMgr;
  private _pluginSession?: PluginSession;

  constructor() {
    this._cliClientMgr = new CliClientMgr();
  }

  loadPlugin(params: PluginLoadParams): Promise<PluginSession> {
    const pluginLoadCommand = new PluginLoadCommand(this, params);
    return pluginLoadCommand.execute() as Promise<PluginSession>;
  }

  registerAppConnectionsListener(listener: AppConnectionListener): void {
    this._cliClientMgr.registerAppConnectionsListener(listener);
  }

  registerPluginStateListener(listener: PluginStateListener): void {
    this._cliClientMgr.registerPluginStateListener(listener);
  }

  registerHostAppLogListener(listener: HostAppLogListener): void {
    this._cliClientMgr.registerHostAppLogListener(listener);
  }

  refreshList(): Promise<PluginInfoResult[]> {
    const refreshListCommand = new RefreshListCommand(this);
    return refreshListCommand.execute() as Promise<PluginInfoResult[]>;
  }

  debugPlugin(pluginSession: PluginSession, params: PluginDebugParams): Promise<DebugUrlInfo[]> {
    const debugCommand = new PluginDebugCommand(this, params);
    debugCommand.pluginSession = pluginSession;
    return debugCommand.execute() as Promise<DebugUrlInfo[]>;
  }

  unloadPlugin(pluginSession: PluginSession, params: PluginUnloadParams): Promise<boolean> {
    const unloadCommand = new PluginUnloadCommand(this, params);
    unloadCommand.pluginSession = pluginSession;
    return unloadCommand.execute() as Promise<boolean>;
  }

  reloadPlugin(pluginSession: PluginSession, params: PluginReloadParams): Promise<boolean> {
    const reloadCommand = new PluginReloadCommand(this, params);
    reloadCommand.pluginSession = pluginSession;
    return reloadCommand.execute() as Promise<boolean>;
  }

  executePluginTest(pluginSession: PluginSession, params: PluginTestParams): Promise<void> {
    const pluginTestCommand = new PluginTestCommand(this, params);
    pluginTestCommand.pluginSession = pluginSession;
    return pluginTestCommand.execute() as Promise<void>;
  }

  setupPluginTest(params: PluginTestParams): Promise<void> {
    const pluginTestSetupCommand = new PluginTestSetupCommand(this, params);
    return pluginTestSetupCommand.execute() as Promise<void>;
  }

  validatePluginManifest(params: PluginValidateParams): Promise<boolean> {
    const pluginValidateCommand = new PluginValidateCommand(this, params);
    return pluginValidateCommand.execute() as Promise<boolean>;
  }

  packagePlugin(params: PluginPackageParams): Promise<string> {
    const pluginPackageCommand = new PluginPackageCommand(this, params);
    return pluginPackageCommand.execute() as Promise<string>;
  }

  getPluginLogPath(params: PluginLogParams): Promise<unknown> {
    const pluginLogCommand = new PluginLogCommand(this, params);
    return pluginLogCommand.execute() as Promise<unknown>;
  }

  getPluginSession(): PluginSession {
    if (!this._pluginSession) {
      this._pluginSession = PluginSession.createFromRcFile();
    }
    return this._pluginSession;
  }

  getConnectedApps(): AppEndPoint[] {
    return this._cliClientMgr.getConnectedApps();
  }

  connectToService(port: number): Promise<void> {
    return this._cliClientMgr.connectToService(port);
  }

  disconnect(): void {
    return this._cliClientMgr.disconnect();
  }
}

export default PluginMgr;
