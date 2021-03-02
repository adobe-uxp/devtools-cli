/* eslint-disable class-methods-use-this */
/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { ipcRenderer } from "electron";
import IAppExternalRuntimeBridge from "../model/IAppExternalRuntimeBridge";
import KeyboardShortcutsMgr from "../common/KeyboardShortcutsMgr";

const keyboardShortcutsMgr = KeyboardShortcutsMgr.instance();

export default class AppElectronMainRuntimeBridge extends IAppExternalRuntimeBridge {

    constructor() {
        super();
        this._existingListeners = new Map();
        this._initialiseKeyboardShortcuts();
    }

    _initialiseKeyboardShortcuts() {
        this._checkAddMainProcessListener("keyboard-shortcut", (_event, name) => {
            keyboardShortcutsMgr.triggerHandle(name);
        });
    }

    _checkAddMainProcessListener(eventName, callback) {
        if (this._existingListeners.has(eventName)) {
            return;
        }
        ipcRenderer.on(eventName, callback);
        this._existingListeners.set(eventName, true);
    }

    monitorAppPowerChanges() {
        const appPowerEventCommon = (name) => {
            try {
                this.emit(name);
            }
            catch (err) {
                UxpAppLogger.verbose("Error handling the power event " + name);
                UxpAppLogger.verbose(err.message);
            }
        };
        this._checkAddMainProcessListener("appResumed", () => {
            appPowerEventCommon("appResumed");
        });
        this._checkAddMainProcessListener("appSuspended", () => {
            appPowerEventCommon("appSuspended");
        });
    }

    startService(port) {
        return ipcRenderer.invoke("start-service", port);
    }

    checkServicePort(port) {
        return ipcRenderer.invoke("check-service-port", port);
    }

    openDevtoolsInspector(cdtWSDebugUrl, pluginDetails, data) {
        this._checkAddMainProcessListener("cdt-inspect-window-closed", async(event, clientData) => {
            try {
                this.emit("pluginCdtWindowClosed", clientData);
            }
            catch (err) {
                UxpAppLogger.error("CDT Window close Event handler failed with error " + err);
            }
        });

        this._checkAddMainProcessListener("cdt-inspect-window-opened", async(event, clientData) => {
            try {
                this.emit("pluginCdtWindowOpened", clientData);
            }
            catch (err) {
                UxpAppLogger.error("CDT Window open Event handler failed with error " + err);
            }
        });

        return ipcRenderer.invoke("launch-chrome-devtools-inspector", cdtWSDebugUrl, pluginDetails, data);
    }

    isDevtoolsEnabled() {
        return ipcRenderer.invoke("is-devtools-enabled");
    }

    enableDevTools() {
        return ipcRenderer.invoke("enable-devtools");
    }

    disableDevTools() {
        return ipcRenderer.invoke("disable-devtools");
    }

    watchPlugin(pluginManifestPath, data) {
        this._checkAddMainProcessListener("plugin-contents-change", async(event, clientData) => {
            try {
                this.emit("pluginContentsChange", clientData);
            }
            catch (err) {
                UxpAppLogger.error("Plugin-Watch change Event handler failed with error " + err);
            }
        });

        return ipcRenderer.invoke("watch-plugin", pluginManifestPath, data);
    }

    unWatchPlugin(pluginManifestPath, data) {
        return ipcRenderer.invoke("unwatch-plugin", pluginManifestPath, data);
    }

    enableLogForwaring() {
        const appLogger = window.UxpAppLogger;
        const logTypes = [ "log", "error", "warn", "verbose" ];
        for (let type of logTypes) {
            appLogger.on(type, (data) => {
                ipcRenderer.invoke("app-log-event", {
                    type,
                    message: data.message,
                    args: data.args
                });
            });
        }
    }
}
