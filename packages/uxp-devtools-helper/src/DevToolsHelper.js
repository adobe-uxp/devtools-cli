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

/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
const DevToolNativeLib = require('./DevToolNativeLib');
const { devToolsCommandRunner, isDevToolsEnabled } = require("./DevToolsUtils");

// Note: not including "XD" for now - alpha release.
const kSupportedUxpHostAppsIds = [
    "PS", "UXPD"
];

class DevToolHelperNative {
    constructor(seldEndPointId, seldEndPointVersion) {
        this._nativeAdapter = new DevToolNativeLib.VulcanAdapter(seldEndPointId, seldEndPointVersion);
        this._portListeners = [];
    }

    getAppsList() {
        const appsList = this._nativeAdapter.getAppsList();
        return appsList;
    }

    setServerDetails(isStarted, port) {
        const payload = {
            port,
        };
        this._nativeAdapter.setServerDetails(isStarted, JSON.stringify(payload));
    }

    _handlePortDetails(type, payload, appId, appVersion) {
        for (const listener of this._portListeners) {
            listener(type, {
                payload,
                appId,
                appVersion,
            });
        }
    }

    terminate() {
        if (this._servicePortCallback) {
            this._nativeAdapter.disconnect();
        }
        this._nativeAdapter = null;
    }

    getServicePort(portListener) {
        this._portListeners.push(portListener);

        if (!this._servicePortCallback) {
            this._servicePortCallback = this._handlePortDetails.bind(this);
            this._nativeAdapter.getServicePort(this._servicePortCallback);
        }
    }
}

function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

const kUDTServerAppId = "UTDS";
const kUDTClientAppId = "UTDC";

class DevToolsHelper {
    constructor(isServer) {
        const kVersion = "1.0.0";
        const appId = isServer ? kUDTServerAppId : kUDTClientAppId;
        this._devToolsNative = new DevToolHelperNative(appId, kVersion);
    }

    getAppsList() {
        const rawAppsList = this._devToolsNative.getAppsList();
        const appsList = rawAppsList.map((raw) => {
            const data = raw.split(",");
            return {
                appId: data[0],
                appVersion: data[1],
                name: data[2]
            };
        });

        const supportedAppsList = appsList.filter((app) => {
            return kSupportedUxpHostAppsIds.includes(app.appId);
        });
        return supportedAppsList;
    }

    setServerDetails(port) {
        this._devToolsNative.setServerDetails(true, port);
    }

    getServicePort() {
        const prom = createDeferredPromise();
        let timeout;
        const errorMsg = "Cound not connect to the UXP Developer Service. Start the cli service and try again.";
        this._devToolsNative.getServicePort((type, data) => {
            try {
                const payload = JSON.parse(data.payload);
                prom.resolve(payload.port);
            } catch (err) {
                prom.reject(new Error(errorMsg));
            }
            prom.handled = true;
            if (timeout) {
                clearTimeout(timeout);
            }
        });

        timeout = setTimeout(() => {
            if (!prom.handled) {
                // we will time out here. Service hasn't replied. Mostly it is not running.
                prom.reject(new Error(errorMsg));
            }
            timeout = null;
        }, 5000);

        return prom.promise;
    }

    // crajTODO - all devTools enabling commands will be worked out after integrating the
    // the native NodeJS lib.
    static disableDevTools() {
        return devToolsCommandRunner(false);
    }

    static enableDevTools() {
        return devToolsCommandRunner(true);
    }

    static isDevToolsEnabled() {
        return isDevToolsEnabled();
    }

    terminate() {
        if (this._devToolsNative) {
            this._devToolsNative.terminate();
            this._devToolsNative = null;
        }
    }
}

module.exports = DevToolsHelper;
