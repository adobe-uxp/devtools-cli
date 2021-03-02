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
const path = require("path");
const { loadPluginSessionFromUxpRc } = require("../../utils/Common");
const { CoreHelpers } = require("@adobe/uxp-devtools-core");

const watchOptions = {
    path: {
        describe: "Relative path to plugin's source folder. Defaults to the current working directory.",
        demandOption: false,
    },
    apps: {
        describe: "Space delimited list of app IDs for which the plugin should be watched. The supported app IDs can be retrieved using `uxp apps list`. The default action is to watch the plugin for all currently running apps specified in the plugin's manifest.",
        demandOption: false,
    },
};

let cliClientInstance, params;

function setupWatchStopRequestListeners(watchServiceInstance, pluginPath) {
    const prom = CoreHelpers.createDeferredPromise();
    const unwatchHandler = function() {
        watchServiceInstance.stopPluginWatch(pluginPath).then(() => {
            cliClientInstance.disconnect();
            prom.resolve(true);
        });
    };

    process.on("SIGINT", unwatchHandler);
    process.on("SIGTERM", unwatchHandler);
    return prom.promise;
}

function handlePluginWatchResult() {
    // Reload plugin on change.
    console.log("Plugin Contents Changed. Reloading the Plugin.");
    const pluginSession = loadPluginSessionFromUxpRc();
    const prom = cliClientInstance.reloadPlugin(pluginSession,params);
    return prom.then(() => {
        console.log("Plugin Reload Successfully.");
    }).catch((err) => {
        console.error(`${err}`);
    });
}

function handlePluginWatchCommand(args) {
    const relPath = args.path || "";
    const apps = args.apps ? args.apps.split(" ") : [];
    params = {
        apps,
    };
    let pluginPath = path.resolve(relPath);
    cliClientInstance = this.app.client;
    const watchServiceInstance = CoreHelpers.WatchServiceMgr.instance();

    // First connect to service before starting watch.
    const connectProm = cliClientInstance.connect();
    return connectProm.then(() => {
        // Start watching plugin.
        return watchServiceInstance.watchPlugin(pluginPath, handlePluginWatchResult);
    }).then(() => {
        return setupWatchStopRequestListeners(watchServiceInstance, pluginPath);
    }).then(() => {
        return true;
    });
}

const watchCommand = {
    command: "watch",
    description: "Watch the plugin folder and reloads the plugin on change.",
    handler: handlePluginWatchCommand,
    builder: watchOptions,
};

module.exports = watchCommand;
