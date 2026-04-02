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

import type { AppInfo } from '../../types/index.js';

interface CDTClient {
  // CDT client interface - actual implementation in clients/CDTClient.js
  [key: string]: unknown;
}

interface AppClient {
  type: string;
  appInfo: AppInfo;
  loadPlugin: (plugin: PluginDetails) => void;
}

class PluginDetails {
  public hostPlugInSessionId: string;
  public appInfo: AppInfo;
  public pluginPath: string;
  public pluginId: string;
  public cdtClients: Set<CDTClient> = new Set();

  constructor(pluginId: string, pluginPath: string, hostPlugInSessionId: string, appInfo: AppInfo) {
    this.hostPlugInSessionId = hostPlugInSessionId;
    this.appInfo = appInfo;
    this.pluginPath = pluginPath;
    this.pluginId = pluginId;
  }

  addCDTClient(cdtClient: CDTClient): void {
    this.cdtClients.add(cdtClient);
  }

  removeCDTClient(cdtClient: CDTClient): void {
    this.cdtClients.delete(cdtClient);
  }

  getCDTClients(): Set<CDTClient> {
    return this.cdtClients;
  }
}

function isAppSame(a1: AppInfo, a2: AppInfo): boolean {
  return a1.appId === a2.appId && a1.appVersion === a2.appVersion;
}

class PluginSessionMgr {
  private _pluginSessions: Map<string, PluginDetails>;
  private _hostClientSessionIdMap: Map<string, string>;

  constructor() {
    this._pluginSessions = new Map();
    this._hostClientSessionIdMap = new Map();
  }

  getPluginFromHostSessionId(hostPluginSessionId: string): PluginDetails | null {
    let plugin: PluginDetails | null = null;
    this._pluginSessions.forEach((ps) => {
      if (ps.hostPlugInSessionId === hostPluginSessionId) {
        plugin = ps;
      }
    });
    return plugin;
  }

  getAppClientFromSessionId(clientsList: Map<number, AppClient>, clientSessionId: string): AppClient | null {
    const pluginSession = this.getPluginFromSessionId(clientSessionId);
    if (!pluginSession) {
      return null;
    }
    let appClient: AppClient | null = null;
    clientsList.forEach((client) => {
      if (client.type === 'app') {
        if (isAppSame(client.appInfo, pluginSession.appInfo)) {
          appClient = client;
        }
      }
    });
    return appClient;
  }

  getHostSessionIdFromClientId(clientSessionId: string): string | undefined {
    return this._hostClientSessionIdMap.get(clientSessionId);
  }

  getPluginFromSessionId(clientSessionId: string): PluginDetails | undefined {
    const hostPluginSessionId = this.getHostSessionIdFromClientId(clientSessionId);
    if (!hostPluginSessionId) {
      return undefined;
    }
    return this._pluginSessions.get(hostPluginSessionId);
  }

  addPlugin(
    pluginId: string,
    pluginPath: string,
    hostPlugInSessionId: string,
    appInfo: AppInfo,
    clientSessionId: string | null,
  ): string {
    const plugin = new PluginDetails(pluginId, pluginPath, hostPlugInSessionId, appInfo);
    if (clientSessionId !== null) {
      this._clearHostSessionForClientSessionId(clientSessionId);
    }
    const sessionId = clientSessionId != null ? clientSessionId : hostPlugInSessionId;
    this._pluginSessions.set(hostPlugInSessionId, plugin);
    this._hostClientSessionIdMap.set(sessionId, hostPlugInSessionId);
    return sessionId;
  }

  private _clearHostSessionForClientSessionId(clientSessionId: string): void {
    const hostSessionId = this._hostClientSessionIdMap.get(clientSessionId);
    if (hostSessionId) {
      this._pluginSessions.delete(hostSessionId);
    }
  }

  removePlugin(plugin: PluginDetails): void {
    this._pluginSessions.delete(plugin.hostPlugInSessionId);
  }

  restorePluginSessionOfApp(appClient: AppClient): void {
    const ainfo = appClient.appInfo;
    const appPlugins: PluginDetails[] = [];
    this._pluginSessions.forEach((plugin) => {
      if (isAppSame(plugin.appInfo, ainfo)) {
        appPlugins.push(plugin);
      }
    });
    for (const plugin of appPlugins) {
      appClient.loadPlugin(plugin);
    }
  }
}

export default PluginSessionMgr;
