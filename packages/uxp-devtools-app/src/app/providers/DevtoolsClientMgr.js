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

import { UDTApplication } from "@adobe/uxp-devtools-core";

import EventEmitter from "events";

export default class DevtoolsClientMgr extends EventEmitter {

    createCLIClientInstance(servicePort, logger) {
        const coreInitParams = {
            servicePort,
            logger
        };
        UDTApplication.createInstance(coreInitParams);
        this._cliClient = UDTApplication.instance().client;
        this._cliClient.registerAppConnectionsListener(this.appConnectionUpdate.bind(this));
        this._cliClient.registerPluginStateListener(this.pluginStateUpdate.bind(this));
    }

    connectToService() {
        return this._cliClient.connect();
    }

    loadPlugin(plugin) {
        return this._cliClient.loadPlugin({
            manifest: plugin.manifestPath,
            breakOnStart: plugin.pluginOptions.breakOnStart,
            apps: [ plugin.pluginHost.app ]
        });
    }

    unloadPlugin(plugin) {
        return this._cliClient.unloadPlugin(plugin.serviceSession, {
            apps: [ plugin.pluginHost.app ]
        });
    }

    reloadPlugin(plugin) {
        return this._cliClient.reloadPlugin(plugin.serviceSession);
    }

    debugPlugin(plugin) {
        return this._cliClient.debugPlugin(plugin.serviceSession);
    }

    packagePlugin(packageParams) {
        return this._cliClient.packagePlugin(packageParams);
    }

    appConnectionUpdate(type, appDetails) {
        this.emit("appConnectionUpdate", {
            type,
            appDetails,
        });
    }

    pluginStateUpdate(type, plugin) {
        this.emit("pluginStateUpdate", {
            type,
            plugin
        });
    }
}
