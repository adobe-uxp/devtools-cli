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

import { computed, observable, action } from "mobx";
import PluginViewModel from "./PluginViewModel";
import AppLoggerViewModel from "./AppLoggerViewModel";

export default class DevtoolAppViewModel {
    @observable _selectedPlugins = [];
    @observable _appSettingsPref = {};
    @observable _logs = [];

    constructor(devtoolsAppModel) {
        this._appModel = devtoolsAppModel;
        this._appLogger = observable(new AppLoggerViewModel(window.UxpAppLogger));
        this._appSettingsPrefs  = {
            theme: "light",
            port: "14001"
        };
    }

    // This App Logger is to support UI based use-case like Batching / Grouping Logs that are from given action.
    @computed
    get appLogger() {
        return this._appLogger;
    }

    @computed
    get appState() {
        return this._appModel.appState;
    }

    @computed
    get pluginsList() {
        return this._appModel.pluginsList.map(plugin => new PluginViewModel(plugin));
    }

    @computed
    get connectedApps() {
        return this._appModel.connectedHostAppsList;
    }

    @computed
    get devToolsEnabled() {
        return this._appModel.devtoolsEnabled;
    }

    @action
    setSelectedPlugins(list) {
        this._selectedPlugins = list;
    }

    @computed
    get selectedPlugins() {
        return this._selectedPlugins;
    }

    @computed
    get appSettingsPrefs() {
        return this._appSettingsPrefs;
    }

    @action
    setAppSettingsPerfs(prefs) {
        this._appSettingsPrefs = prefs;
    }

    performAppAction(actionName, params) {
        return this._appModel.performAppAction(actionName, params);
    }

    performPluginAction(plugin, actionName, params) {
        return this._appModel.performPluginAction(plugin.modelId, actionName, params);
    }

    @action
    clearLogs() {
        this.appLogger.clearLogs();
    }

    @computed
    get logs() {
        return this._appLogger.logs;
    }
}
