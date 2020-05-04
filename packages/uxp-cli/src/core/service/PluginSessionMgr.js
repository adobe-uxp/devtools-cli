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

class PluiginDetails {
    constructor(hostPlugInSessionId, appInfo) {
        this.hostPlugInSessionId = hostPlugInSessionId;
        this.appInfo = appInfo;
    }

    setCDTClient(cdtClient) {
        this.cdtClient = cdtClient;
    }

    getCDTClient() {
        return this.cdtClient;
    }
}

function isAppSame(a1, a2) {
    return a1.appId === a2.appId && a1.version === a2.version;
}

class PluginSessionMgr {
    constructor() {
        this._pluginSessions = new Map();
    }

    getPluginFromHostSessionId(hostPluginSessionId) {
        let plugin = null;
        this._pluginSessions.forEach((ps) => {
            if (ps.hostPlugInSessionId === hostPluginSessionId) {
                plugin = ps;
            }
        });
        return plugin;
    }

    getAppClientFromSessionId(clientsList, clientSessionId) {
        const pluginSession = this.getPluginFromSessionId(clientSessionId);
        let appClient = null;
        clientsList.forEach((client) => {
            if (client.type === "app") {
                if (isAppSame(client.appInfo, pluginSession.appInfo)) {
                    appClient = client;
                }
            }
        });
        return appClient;
    }

    getPluginFromSessionId(clientSessionId) {
        return this._pluginSessions.get(clientSessionId);
    }

    addPlugin(hostPlugInSessionId, appInfo) {
        const plugin = new PluiginDetails(hostPlugInSessionId, appInfo);
        // use the host-session-id as the client session id itself.
        this._pluginSessions.set(hostPlugInSessionId, plugin);
        return hostPlugInSessionId;
    }

    removePlugin(plugin) {
        this._pluginSessions.delete(plugin.hostPlugInSessionId);
    }

    restorePluginSessionOfApp(appClient) {
        const ainfo = appClient.appInfo;
        const appPlugins = [];
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

module.exports = PluginSessionMgr;
