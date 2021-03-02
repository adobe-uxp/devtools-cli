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


/* eslint-disable class-methods-use-this */
const EventEmitter = require("events");
const { UDTApplication, CoreHelpers } = require("@adobe/uxp-devtools-core");
const { getAppDataFolder } = require("./CommonUtils");
const path = require("path");
const fs = require("fs-extra");
const DevtoolsLogMgr = require("./DevtoolsLogMgr");

let sInstance = null;

function getDevtoolsScriptFolder() {
    const appDataFolder = getAppDataFolder();
    const scriptsFolder = path.resolve(appDataFolder, "devtools_scripts");
    fs.ensureDirSync(scriptsFolder);
    return scriptsFolder;
}

class AppLogger extends EventEmitter {
    constructor() {
        super();
        const methods = [ "log", "error", "warn", "verbose" ];
        for (let method of methods) {
            this[method] = function(message, ...args) {
                DevtoolsLogMgr.logMainEvent(method, message, args);
            };
        }
    }
}


class DevtoolsServiceMgr extends EventEmitter {
    static instance() {
        if (!sInstance) {
            sInstance = new DevtoolsServiceMgr();
        }
        return sInstance;
    }

    constructor() {
        super();
        const logger = new AppLogger();
        const coreInitParams = {
            logger
        };
        UDTApplication.createInstance(coreInitParams);
        this._service = UDTApplication.instance().server;
    }

    startService(port) {
        const prom = this._service.startServer(port);
        return prom.then((res) => {
            this._serviceStarted = true;
            return res;
        });
    }

    checkServicePort(port) {
        if (this._serviceStarted) {
            // service is already running - this check if useful for debugging purpose .
            // where we keep reloading the CEF browser to refresh any UI changes -
            // in such cases - server will be already running and would mean - we need to kill the server and start again.
            return Promise.resolve("serviceRunning");
        }
        const prom = CoreHelpers.isPortAvailable(port);
        return prom.then((result) => {
            return result === true ? "available" : "inuse";
        });
    }

    isDevToolsEnabled() {
        return Promise.resolve(this._service.isDevToolsEnabled());
    }

    enableDevTools() {
        const scriptsFolder = getDevtoolsScriptFolder();
        return this._service.enableDevTools({
            controlled: true,
            scriptsFolder
        });
    }

    handleAppQuit() {
        this._service.handleAppQuit();
    }

    disableDevTools() {
        const scriptsFolder = getDevtoolsScriptFolder();
        return this._service.disableDevTools({
            controlled: true,
            scriptsFolder
        });
    }
}

module.exports = DevtoolsServiceMgr;
