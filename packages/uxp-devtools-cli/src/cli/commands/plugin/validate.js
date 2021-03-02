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

const validateOptions = {
    manifest: {
        describe: "Relative path to plugin's manifest.json file. Defaults to the manifest.json file in current working directory.",
        demandOption: false,
    }
};

function handlePluginValidateCommand(args) {
    const manifestRelPath = args.manifest ? args.manifest : "manifest.json";
    const manifest = path.resolve(manifestRelPath);
    const params = {
        manifest,
    };

    const prom = this.app.client.executePluginCommand("validatePluginManifest", params);
    return prom.then(() => {
        console.log("Manifest is validated successfully.");
        return true;
    }).catch((err) => {
        console.error("Manifest Validation Failed.");
        console.error(`${err}`);
        return false;
    });
}

const validateCommand = {
    command: "validate",
    description: "Validates the plugin manifest.",
    handler: handlePluginValidateCommand,
    builder: validateOptions,
};

module.exports = validateCommand;
