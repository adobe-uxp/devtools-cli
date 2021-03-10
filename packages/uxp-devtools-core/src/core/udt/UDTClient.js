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


const PluginMgr = require("../client/PluginMgr");

function createDevtoolsMgrInstance() {
    const DevToolsMgr = require("../common/DevToolsMgr");
    return new DevToolsMgr(false);
}

class UxpDevToolsClient {
    constructor(servicePort) {
        this._servicePort = servicePort;
        this._pluginMgr = new PluginMgr();
        if (!servicePort) {
            // only initialize when the service port is not know -
            // we are using devtools mgr mainly to discover the service port which is running
            // in another process - we discover the port details via Vulcan -
            // it might be the case that both server and client might be running in the same app -
            // so, in such cases - we should avoid initializing vulcan lib twice in the same process.
            this._devToolsMgr = createDevtoolsMgrInstance();
        }
    }

    registerAppConnectionsListener(listener) {
        this._pluginMgr.registerAppConnectionsListener(listener);
    }

    registerPluginStateListener(listener) {
        this._pluginMgr.registerPluginStateListener(listener);
    }

    connectedApps() {
        return this._pluginMgr.getConnectedApps();
    }

    /*
    Note: this is deprecated now - `apps list` command will display connected app - instead of supported.
    getAppsList() {
        if (!this._devToolsMgr) {
            return null;
        }
        return this._devToolsMgr.getAppsList();
    }
    */

    debugPlugin(pluginSession, params) {
        return this._pluginMgr.debugPlugin(pluginSession, params);
    }

    unloadPlugin(pluginSession, params) {
        return this._pluginMgr.unloadPlugin(pluginSession, params);
    }

    loadPlugin(params) {
        return this._pluginMgr.loadPlugin(params);
    }

    reloadPlugin(pluginSession, params) {
        return this._pluginMgr.reloadPlugin(pluginSession, params);
    }

    validatePluginManifest(params) {
        return this._pluginMgr.validatePluginManifest(params);
    }

    packagePlugin(params) {
        return this._pluginMgr.packagePlugin(params);
    }

    connect() {
        const prom = this.getServicePort();
        return prom.then((port) => {
            return this._pluginMgr.connectToService(port);
        });
    }

    // This can be used by host (eg: cli) which wans to run plugin commands to completion from start
    // this method takes care of peforming all the required initialization like conneting to
    // cli service executing the actual plugin command and performing the required clean-up -
    // like terminating connection to service and returning the command results.
    executePluginCommand(commandName, ...args) {
        if (!this[commandName]) {
            throw new Error(`Devtools client: ${commandName} - no such command supported`);
        }
        // first connect to service. warpping the connect in promise so that an exceptions
        // errors are reported correctly.
        const prom = Promise.resolve(true);
        return prom.then(() => {
            return this.connect();
        }).then(() => {
            // execute the actual command.
            return this[commandName](...args);
        }).then((results) => {
            this.disconnect();
            return results;
        }).catch((err) => {
            // perform post clean-up - like disconnecting from service.
            this.disconnect();
            throw err;
        });
    }

    getServicePort() {
        // if the service port was provided during initialization - then just use that instead
        // of discovering the service port details.
        if (this._servicePort) {
            return Promise.resolve(this._servicePort);
        }
        if (this._devToolsMgr) {
            return this._devToolsMgr.discoverServicePort();
        }
        return Promise.reject(new Error("Cannot get the Service port details!"));
    }

    disconnect() {
        this._devToolsMgr.terminate();
        this._pluginMgr.disconnect();
    }
}

module.exports = UxpDevToolsClient;
