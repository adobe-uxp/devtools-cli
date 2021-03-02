/* eslint-disable class-methods-use-this */
/* eslint-disable global-require */
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

const Logger = require("../common/Logger");

const appState = {};

function installGlobalLogger(logger) {
    if (global.Logger) {
        console.error("Global Logger is already initialized. This should not be the case");
    }
    global.UxpLogger = logger;
}

class UxpDevtoolsApplicationImpl {
    constructor(initParams) {
        appState.servicePort = initParams.servicePort;
        let { logger } = initParams;
        if (logger) {
            Logger.setProvider(logger);
        }
        installGlobalLogger(Logger);
        appState.hostDelegate = initParams.hostDelegate;
    }

    set logLevel(level) {
        Logger.level = level;
    }

    get client() {
        if (!appState.client) {
            const UxpDevtoolsClient = require("./UDTClient");
            appState.client = new UxpDevtoolsClient(appState.servicePort);
        }
        return appState.client;
    }

    get server() {
        if (!appState.server) {
            const UxpDevtoolsServer = require("./UDTServer");
            appState.server = new UxpDevtoolsServer();
        }
        return appState.server;
    }
}

let sIntializerInstance = null;

class UxpDevtoolsApplication {
    static createInstance(initializerParams) {
        if (sIntializerInstance) {
            throw new Error("Devtools Initializer instance is already created!");
        }
        sIntializerInstance = new UxpDevtoolsApplicationImpl(initializerParams);
    }

    static instance() {
        return sIntializerInstance;
    }
}

module.exports = UxpDevtoolsApplication;
