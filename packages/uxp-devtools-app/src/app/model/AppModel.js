/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const _ = require("lodash");

import { observable, action, computed } from "mobx";
import AppModelState from "../common/AppModelState";


function isHostAppSame(a1, a2) {
    return a1.appId == a2.appId && a1.appVersion == a2.appVersion
            && a1.appName == a2.appName;
}

class AppModel {
    @observable _appState;
    @observable pluginsList = [];
    @observable connectedHostAppsList = [];
    @observable _devtoolsEnabled = false;

    constructor(controller) {
        this._appState = AppModelState.BOOTING;
        this._controller = controller;
    }

    @action
    addPlugin(plugin) {
        this.pluginsList.push(plugin);
    }

    @action
    removePluginWithId(modelId) {
        _.remove(this.pluginsList, (plugin) => {
            return (plugin.modelId == modelId);
        });
    }

    @action
    setDevtoolsEnabled(enable) {
        this._devtoolsEnabled = enable;
    }

    @computed
    get devtoolsEnabled() {
        return this._devtoolsEnabled;
    }

    get appState() {
        return this._appState;
    }

    @action
    setAppState(state) {
        this._appState = state;
    }

    @action
    hostAppConnected(hostApp) {
        this.connectedHostAppsList.push(hostApp);
    }

    @action
    unloadPluginsConnectedToApp(hostApp) {
        try {
            const loadPluginsList = this.pluginsList.filter((plugin) => {
                if (!plugin.isLoaded) {
                    return false;
                }
                let isLoadedInApp = false;
                // NOTE: this is currently handling only One App -
                // When we add support for plugin loading multiple apps - we need to change this logic a bit.
                const sessions = plugin.serviceSession.sessions;
                for (const ses of sessions) {
                    const app = ses.app;
                    if (app.id == hostApp.appId && app.version == hostApp.appVersion) {
                        isLoadedInApp = true;
                        break;
                    }
                }
                return isLoadedInApp;
            });

            // reset the service session of the all these plugins connected to this host-app.
            for (const plugin of loadPluginsList) {
                plugin.setServiceSession(null);
            }
        }
        catch (err) {
            UxpAppLogger.error("Failed to Unload the plugins due to Host app disconnect. Error: " + err);
        }
    }

    @action
    unloadPlugin(pluginDetails) {
        this.pluginsList.filter((plugin) => {
            if (!plugin.isLoaded) {
                return false;
            }
            const sessions = plugin.serviceSession.sessions;
            for (const ses of sessions) {
                if (ses.pluginSessionId === pluginDetails.hostPlugInSessionId) {
                    plugin.setServiceSession(null);
                    return;
                }
            }
        });
    }

    @action
    hostAppDisconnected(hostApp) {
        this.unloadPluginsConnectedToApp(hostApp);
        _.remove(this.connectedHostAppsList, (app) => {
            return isHostAppSame(app, hostApp);
        });
    }

    @action
    handleAllAppsDisconnected() {
        this.connectedHostAppsList.forEach((hostApp) => {
            this.hostAppDisconnected(hostApp);
        });
    }

    getPluginWithId(modelId) {
        for (let i = 0; i < this.pluginsList.length; ++i) {
            const plugin = this.pluginsList[i];
            if (plugin.modelId == modelId) {
                return plugin;
            }
        }
        return null;
    }

    performPluginAction(pluginModelId, actionName, params) {
        const plugin = this.getPluginWithId(pluginModelId);
        if (!plugin) {
            return Promise.reject(new Error("Invalid Plugin. Plugin is not present in Workspace."));
        }
        return this._controller.performPluginAction(plugin, actionName, params);
    }

    performAppAction(actionName, params) {
        return this._controller.performAppAction(actionName, params);
    }
}

export default AppModel;
