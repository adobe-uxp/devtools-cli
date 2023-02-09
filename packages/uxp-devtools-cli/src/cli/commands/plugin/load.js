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
const { DevToolsError } = require("@adobe-fixed-uxp/uxp-devtools-core");

const loadOptions = {
    manifest: {
        describe: "Relative path to plugin's manifest.json file. Defaults to the manifest.json in the current working directory.",
        demandOption: false,
    },
    apps: {
        describe: "Space delimited list of app IDs into which the plugin should be loaded. The supported app IDs can be retrieved using `uxp apps list`. The default action is to load the plugin into all currently running apps specified in the plugin's manifest.",
        demandOption: false,
    },
    breakOnStart: {
        describe: "Blocks the plugin until a debugger attaches. If specified, attach is assumed, and a debugger will immediately be spawned. Defaults to false.",
        demandOption: false,
    },
};

function handlePluginLoadCommand(args) {
    const manifestRelPath = args.manifest ? args.manifest : "manifest.json";
    const manifest = path.resolve(manifestRelPath);
    const apps = args.apps ? args.apps.split(" ") : [];
    const breakOnStart = args.breakOnStart === "true";
    const params = {
        manifest,
        apps,
        breakOnStart,
    };

    const prom = this.app.client.executePluginCommand("loadPlugin", params);
    return prom.then((pluginSession) => {
        // commit this plugin session to a uxprc file so as to persist the state
        // for later commands ( like plugin debug/log et al)
        const uxprcDirPath = path.dirname(manifest);
        pluginSession.commitToRc(uxprcDirPath);
        const loadSuccessMsg = DevToolsError.getUserFriendlyMessageFromCode(DevToolsError.ErrorCodes.PLUGIN_LOAD_SUCCESS);
        console.log(loadSuccessMsg);
        return true;
    });
}

const loadCommand = {
    command: "load",
    description: "Loads the plugin in the target application.",
    handler: handlePluginLoadCommand,
    builder: loadOptions,
};

module.exports = loadCommand;
