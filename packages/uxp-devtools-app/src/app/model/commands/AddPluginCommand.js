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

import Plugin from "../plugin/Plugin";

import _ from "lodash";

import BaseCommand from "./BaseCommand";
const { remote } = require("electron");
const fs = require("fs");


async function showManifestFilePickerDialog() {
    const dialog = remote.dialog;
    const message = "Select the plugin's manifest.json file";
    const title = message;
    const options = { message, title , properties:[ "openFile" ], filters: [ { name: "UXP Manifest File", extensions: [ "json" ] } ] };
    try {
        const window = remote.getCurrentWindow();
        const result = await dialog.showOpenDialog(window,options);
        if (result && !result.canceled && Array.isArray(result.filePaths)) {
            return result.filePaths[0];
        }
    }
    catch (err) {
        UxpAppLogger.error("Manifest file picker dialog failed with Error " + err);
    }

    return undefined;
}

const ErrorCode = {
    ALREADY_ADDED: 1,
    DIALOG_CANCELLED: 2,
    NO_PLUGIN_MANIFEST: 3,
    INVALID_PLUGIN_PARAMS: 4,
    INVALID_MANIFEST:5
};

export default class AddPluginCommand extends BaseCommand {

    isPluginAlreadyPresent(manifestId, hostapp) {
        const existingList = this.appController.appModel.pluginsList;
        const pluginDetails = existingList.map((plugin) => {
            return {
                id: plugin.manifest.id,
                pluginHost: plugin.pluginHost.app
            };
        });

        const index = _.findIndex(pluginDetails, (p) => {
            return (p.id === manifestId && p.pluginHost === hostapp);
        });
        return index >= 0;
    }

    fetchApplicableHostApps(manifest) {
        const manifestAppsList = Array.isArray(manifest.host) ? manifest.host : [ manifest.host ];
        if (this.params && this.params.hostParam) {
            const applicableApps = manifestAppsList.filter(host => host.app == this.params.hostParam);
            return applicableApps;
        }
        return manifestAppsList;
    }

    createPluginsList(pickedManifestPath) {
        let plugin  = null;
        const pluginsList = [];
        const manifest = JSON.parse(fs.readFileSync(pickedManifestPath, "utf8"));
        if (!manifest || !manifest.host) {
            const error = this.createError(ErrorCode.INVALID_MANIFEST, "Invalid manifest", "Add Plugin Failed");
            throw error;
        }
        const hosts = this.fetchApplicableHostApps(manifest);
        hosts.map((host) => {
            const pluginEntryPresent = this.isPluginAlreadyPresent(manifest.id, host.app);
            if (!pluginEntryPresent) {
                plugin = new Plugin({ pickedManifestPath }, host);
                pluginsList.push(plugin);
            }
        });
        if (pluginsList.length == 0) {
            const error = this.createError(ErrorCode.ALREADY_ADDED, `Plugin with id: ${manifest.id} and ${JSON.stringify(manifest.host,[ "app" ])} already exists in workspace.`, "Add Plugin Failed");
            throw error;
        }
        return pluginsList;
    }

    async getmanifestPathFromInputOrUser() {
        const isProgramMode = this.params && this.params.programMode;
        if (isProgramMode) {
            if (this.params.manifestPath) {
                return this.params.manifestPath;
            }
            throw new Error(ErrorCode.INVALID_PLUGIN_PARAMS);
        }
        const pickedFile = await showManifestFilePickerDialog();
        if (!pickedFile) {
            return ErrorCode.DIALOG_CANCELLED;
        }
        return pickedFile;
    }

    async execute() {
        let  manifestPath = this.params && this.params.manifestPath;
        if (!manifestPath) {
            manifestPath =  await this.getmanifestPathFromInputOrUser();
        }
        if (typeof manifestPath != "string") {
            return Promise.resolve(manifestPath);
        }

        const pickedManifestPath = manifestPath;
        if (!fs.existsSync(pickedManifestPath)) {
            const error = this.createError(ErrorCode.NO_PLUGIN_MANIFEST, "Manifest file not found", "Add Plugin Failed");
            throw error;
        }
        const pluginsList = this.createPluginsList(pickedManifestPath);

        pluginsList.map((pluginEntry) => {
            if (this.params && this.params.pluginOptions) {
                pluginEntry.setPluginOptions(this.params.pluginOptions);
            }
            this.appController.appModel.addPlugin(pluginEntry);
        });
        return true;
    }
}
