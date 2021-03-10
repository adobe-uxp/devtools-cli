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

const { loadPluginSessionFromUxpRc } = require("../../utils/Common");

const reloadOptions = {
    apps: {
        describe: "Space delimited list of app IDs into which the plugin should be reloaded. The supported app IDs can be retrieved using `uxp apps list`. The default action is to reload the plugin into all currently running apps specified in the plugin's manifest.",
        demandOption: false,
    },
};

function handlePluginReloadCommand(args) {
    // load the current plugin session from the uxprc file.
    const pluginSession = loadPluginSessionFromUxpRc();
    const apps = args.apps ? args.apps.split(" ") : [];
    const params = {
        apps,
    };
    const prom = this.app.client.executePluginCommand("reloadPlugin", pluginSession, params);
    return prom.then((res) => {
        if (res && !res.breakOnStart) {
            console.log("Plugin Reload successfull.");
        }
        return res;
    });
}

const reloadCommand = {
    command: "reload",
    description: "Reloads this plugin in the app. The plugin needs to be already loaded in application",
    handler: handlePluginReloadCommand,
    builder: reloadOptions,
};

module.exports = reloadCommand;
