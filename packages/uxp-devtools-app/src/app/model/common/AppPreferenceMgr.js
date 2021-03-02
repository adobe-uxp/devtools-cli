/* eslint-disable class-methods-use-this */
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


import path from "path";
import fs from "fs-extra";
import util from "util";

import { getDevtoolsAppDataFolder } from "./AppHelpers";

function getPluginWorkspacePath() {
    const devToolsAppFolder = getDevtoolsAppDataFolder();
    return path.resolve(devToolsAppFolder, "plugins_workspace.json");
}

class PluginDetails {
    constructor(manifestPath, pluginOptions, hostParam) {
        this._manifestPath = manifestPath;
        this._pluginOptions = pluginOptions;
        this._hostParam = hostParam;
    }

    get manifestPath() {
        return this._manifestPath;
    }

    get pluginOptions() {
        return this._pluginOptions;
    }

    get hostParam() {
        return this._hostParam;
    }
}

class PluginWorkspaceV1 {
    static parse(workspaceData) {
        if (workspaceData.version && workspaceData.version > 1) {
            throw new Error("Incompatible Workspace Version Expected 1 but got : " + workspaceData.version);
        }
        let resultList = null;
        let pluginsList = null;
        if (Array.isArray(workspaceData)) {
            pluginsList = workspaceData;
        }
        else {
            pluginsList = workspaceData.plugins;
        }

        resultList = pluginsList.map((plugin) => {
            let manifestPath = null;
            let pluginOptions = null;
            let hostParam = null;
            if (typeof plugin === "string") {
                manifestPath = plugin;
            }
            else {
                manifestPath = plugin.manifestPath;
                pluginOptions = plugin.pluginOptions;
                hostParam = plugin.hostParam;
            }
            return new PluginDetails(manifestPath, pluginOptions, hostParam);
        });
        return new PluginWorkspaceV1(resultList);
    }

    static serialize(pluginList) {
        const plugins = pluginList.map((plugin) => {
            return {
                manifestPath: plugin.manifestPath,
                pluginOptions: plugin.pluginOptions,
                hostParam: plugin.hostParam
            };
        });

        return {
            version: 1,
            plugins
        };
    }

    constructor(pluginsList) {
        this._pluginsList = pluginsList || [];
    }

    get pluginsList() {
        return this._pluginsList;
    }

    get version() {
        return 1;
    }
}

function getPluginWorkspaceDataParser(version) {
    if (!version || version == 1) {
        return PluginWorkspaceV1;
    }
    return null;
}

function serializePluginList(pluginList) {
    const parser = getPluginWorkspaceDataParser(kWorkSpaceVersion);
    return parser.serialize(pluginList);
}

// Current Plugin Workspace Version
const kWorkSpaceVersion = 1;

class AppPreferenceMgr {
    get appDataFolder() {
        return getDevtoolsAppDataFolder();
    }

    // returns the list of plugins folder path - which was saved earlier.
    fetchSavedPluginWorkspace() {
        const pluginsJsonPath = getPluginWorkspacePath();
        const readFile = util.promisify(fs.readFile);
        return readFile(pluginsJsonPath, "utf8").then((contents) => {
            const workspaceData = JSON.parse(contents.toString());
            const version = typeof workspaceData == "object" && workspaceData.version;
            const PluginWorkspaceParser = getPluginWorkspaceDataParser(version);
            if (!PluginWorkspaceParser) {
                throw new Error("No Plugin Workspace Parse found for given version");

            }
            const workspace = PluginWorkspaceParser.parse(workspaceData);
            return workspace.pluginsList;
        }).catch(() => {
            // return empty list.
            return [];
        });
    }

    savePluginWorkspace(pluginsList) {
        const pluginsJsonPath = getPluginWorkspacePath();
        const parentDir = path.dirname(pluginsJsonPath);
        try {
            fs.ensureDirSync(parentDir);
            const pluginWorkspaceData = serializePluginList(pluginsList);
            fs.writeFileSync(pluginsJsonPath, JSON.stringify(pluginWorkspaceData), "utf8");
        }
        catch (err) {
            UxpAppLogger.error(`Failed to save the plugin workspace preference. Error : ${err}`);
        }
    }
}

export default new AppPreferenceMgr();
