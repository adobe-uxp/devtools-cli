/* eslint-disable class-methods-use-this */
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


import AppModel from "./AppModel";
import AppModelState from "../common/AppModelState";

import CommandMgr from "./CommandMgr";
import AppPreferenceMgr from "./common/AppPreferenceMgr";
import AppLogger from "./common/AppLogger";
import { toJS } from "mobx";


function logErrorDetails(err) {
    if (err.message) {
        UxpAppLogger.error(err.message);
    }
    if (err.details) {
        const msg = err.details.message ? err.details.message : err.details;
        if (msg) {
            UxpAppLogger.error(msg, err);
        }
    }
}

export default class AppController {
    constructor(runtimeBridge, devtoolsClientMgr, servicePort) {
        this._started = false;
        this._servicePort = servicePort;
        this._runtimeBridge = runtimeBridge;
        this._devtoolsClientMgr = devtoolsClientMgr;
        this._installGlobalAppLogger();
        this._runtimeBridge.monitorAppPowerChanges();
        this._runtimeBridge.on("pluginCdtWindowClosed", this.handlePluginCDTWindowClosed.bind(this));
        this._runtimeBridge.on("pluginCdtWindowOpened", this.handlePluginCDTWindowOpened.bind(this));
        this._runtimeBridge.on("pluginContentsChange", this.handlePluginFolderContentsChange.bind(this));
        this._runtimeBridge.on("appResumed", this.handleAppResumeEvent.bind(this));

        this._devtoolsClientMgr.on("appConnectionUpdate", this.appConnectionUpdate.bind(this));
        this._devtoolsClientMgr.on("pluginStateUpdate", this.pluginStateUpdate.bind(this));

        this._model = new AppModel(this);

        this._pendingWatchActions = new Map();
    }

    _installGlobalAppLogger() {
        window.UxpAppLogger = AppLogger;
        this._runtimeBridge.enableLogForwaring();
    }

    _handlePluginInspectWindowEventCommon(data, opened) {
        const { pluginModelId, consoleOnly } = data;
        const plugin = this.appModel.getPluginWithId(pluginModelId);
        if (!plugin) {
            return;
        }

        if (consoleOnly) {
            plugin.setLogWindowStatus(opened);
        }
        else {
            plugin.setDebuggerStatus(opened);
        }
    }

    handleAppResumeEvent() {
        UxpAppLogger.verbose("App Resume event received.");
        if (this._clientConnectionValid === false) {
            // app is resumed - looks like the connection is broken - so, we will try to re-connect.
            UxpAppLogger.verbose("Reconnecting app to Service");
            this._connectClient();
        }
    }

    handlePluginCDTWindowOpened(event) {
        this._handlePluginInspectWindowEventCommon(event, true);
    }

    handlePluginCDTWindowClosed(event) {
        this._handlePluginInspectWindowEventCommon(event, false);
    }

    handlePluginFolderContentsChange(data) {
        const { pluginModelId } = data;
        const plugin = this.appModel.getPluginWithId(pluginModelId);
        if (!plugin || !plugin.serviceSession
                || plugin.serviceSession.sessions.length < 1) {
            return;
        }

        const watchAction = "reloadPlugin";

        this._performWatchAction(plugin, watchAction);
    }

    _performWatchAction(plugin, action) {
        const actionKey = `${plugin.modelId}`;
        if (!this._pendingWatchActions.get(actionKey)) {
            this._pendingWatchActions.set(actionKey, true);
            const actionProm = this.performPluginAction(plugin, action);
            actionProm.catch((err) => {
                logErrorDetails(err);
            }).then(() => {
                this._pendingWatchActions.set(actionKey, false);
            });
        }
    }

    appConnectionUpdate(event) {
        const { type, appDetails } = event;
        UxpAppLogger.verbose(`App Connection Update ${JSON.stringify({ type, appDetails })}`);
        if (type == "appConnected") {
            this.appModel.hostAppConnected(appDetails);
        }
        else if (type == "appDisconnected") {
            this.appModel.hostAppDisconnected(appDetails);
        }
        else if (type == "clientConnectionClosed") {
            UxpAppLogger.verbose("Client websocket connection is closed.");
            this._clientConnectionValid = false;
            this.appModel.handleAllAppsDisconnected();
        }
        else if (type == "clientConnectionReady") {
            this._clientConnectionValid = true;
        }
    }

    pluginStateUpdate(event) {
        const { type, plugin } = event;
        if (type == "pluginUnloaded") {
            this.appModel.unloadPlugin(plugin);
        }
    }

    openDevtoolsInspector(wsDebugUrl, pluginDetails, data) {
        return this._runtimeBridge.openDevtoolsInspector(wsDebugUrl, pluginDetails, data);
    }

    get clientMgr() {
        return this._devtoolsClientMgr;
    }

    _startService() {
        return this._runtimeBridge.startService(this._servicePort);
    }

    _connectClient() {
        return this._devtoolsClientMgr.connectToService();
    }

    async isDevtoolsEnabled() {
        return await this._runtimeBridge.isDevtoolsEnabled();
    }

    _initializeCliClientInstance() {
        return this._devtoolsClientMgr.createCLIClientInstance(this._servicePort, window.UxpAppLogger);
    }

    enableDevTools() {
        const prom = this._runtimeBridge.enableDevTools();
        return prom.then(() => {
            if (this._model.appState == AppModelState.DEVTOOLS_NOT_ENABLED) {
                // re intialize the Controller - so that we star the service etc.
                return this.initializeApp();
            }
        });
    }

    disableDevTools() {
        return this._runtimeBridge.disableDevTools();
    }

    watchPlugin(pluginManifestPath, data) {
        return this._runtimeBridge.watchPlugin(pluginManifestPath, data);
    }

    unWatchPlugin(pluginManifestPath, data) {
        return this._runtimeBridge.unWatchPlugin(pluginManifestPath, data);
    }

    async checkServicePort() {
        const result = await this._runtimeBridge.checkServicePort(this._servicePort);
        if (result === "inuse") {
            this.appModel.setAppState(AppModelState.SERVICE_FAILED_PORT_OCCUPIED);
            throw new Error(`Failed to start Service : Port ${this._servicePort} is already in use.`);
        }
        return result;
    }

    async initializeApp() {
        this._model.setAppState(AppModelState.INITIALIZING);

        try {
            const enabled = await this.isDevtoolsEnabled();
            this.appModel.setDevtoolsEnabled(enabled);
            if (!enabled) {
                this._model.setAppState(AppModelState.DEVTOOLS_NOT_ENABLED);
                return;
            }
            const portResult = await this.checkServicePort();
            if (portResult != "serviceRunning") {
                await this._startService();
            }
            await this._initializeCliClientInstance();
            await this._connectClient();
            await this.readSavedPluginWorkspace();
            this._model.setAppState(AppModelState.READY);
        }
        catch(err) {
            UxpAppLogger.error("AppController initialization failed");
            UxpAppLogger.error(err.message);
        }
    }

    async readSavedPluginWorkspace() {
        const pluginDetails = await AppPreferenceMgr.fetchSavedPluginWorkspace();
        if (pluginDetails.length > 0) {
            for (const plugin of pluginDetails) {
                try {
                    await this.performAppAction("addPlugin", {
                        manifestPath: plugin.manifestPath,
                        programMode: true,
                        pluginOptions: plugin.pluginOptions,
                        hostParam: plugin.hostParam
                    });
                }
                catch (err) {
                    // silently eat up the errors when reading from saved data.
                    UxpAppLogger.error(`Failed to add Plugin to Workspace during Start. Plugin Manifest path ${plugin.manifestPath}`);
                    UxpAppLogger.verbose(err.message, err);
                }
            }
        }
    }

    saveCurrentPluginWorkspace() {
        const pluginsList = this.appModel.pluginsList;
        const savePluginsList = pluginsList.map((plugin) => {
            const pluginOptions = toJS(plugin.pluginOptions);
            return {
                manifestPath: plugin.pickedManifestPath,
                hostParam: plugin.pluginHost.app,
                pluginOptions
            };
        });
        AppPreferenceMgr.savePluginWorkspace(savePluginsList);
    }

    get appModel() {
        return this._model;
    }

    performAppAction(appCmdName, params) {
        return CommandMgr.executeAppCommand(this, appCmdName, params);
    }

    performPluginAction(plugin, actionName, params) {
        if (this._clientConnectionValid === false) {
            return Promise.reject(new Error("Connection to Devtools Service is broken. You may need to restart the app if this problem persists."));
        }
        return CommandMgr.executePluginCommand(this, plugin, actionName, params);
    }
}

