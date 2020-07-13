/* eslint-disable class-methods-use-this */
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

/* eslint-disable max-len */
const path = require("path");
const PluginBaseCommand = require("./PluginBaseCommand");
const ManifestHelper = require("../../../helpers/ManifestHelper");
const AppsHelper = require("../../../helpers/AppsHelper");
const log = require("../../../../cli/utils/log");

function validateManifest(manifestPath) {
    const report = ManifestHelper.validateManifest(manifestPath);
    if (!report.isValid) {
        report.details.forEach((error) => log.info(error));
        throw new Error("Load command failed");
    }
    return report.manifest;
}

function createLoadMessage(pluginFolder, breakOnStart) {
    const msg = {
        command: "Plugin",
        action: "load",
        params: {
            provider: {
                type: "disk",
                path: pluginFolder,
            },
        },
        breakOnStart,
    };
    return msg;
}

class PluginLoadCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    get name() {
        return "Load";
    }

    validateParams() {
        if (!this.params || !this.params.manifest) {
            const msg = "Plugin load command manifest paramter is empty. Pass a valid path to plugin manifest.json file";
            return Promise.reject(new Error(msg));
        }
        this.params.apps = this.params.apps || [];
        return Promise.resolve(true);
    }

    executeCommand() {
        // first validate the manifest and get the list of applicable apps.
        const manifest = validateManifest(this.params.manifest);
        const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps);
        if (!applicableApps.length) {
            throw new Error("Could not find any currently running apps applicable for this plugin. Please double check your manifest's `host` entry as well as your --apps option.");
        }

        const connectedApps = this.pm._cliClientMgr.getConnectedApps();
        const applicableAppsForLoading = AppsHelper.filterConnectedAppsForPlugin(connectedApps, applicableApps);
        if (!applicableAppsForLoading.length) {
            console.log(`List of apps connected to uxp devtools service are ${JSON.stringify(connectedApps)}`);
            throw new Error("Load command didn't find any of the currently running apps applicable for loading this plugin. Make sure your target application is running and try again.");
        }
        const pluginFolder = path.dirname(this.params.manifest);
        const loadJsonMsg = createLoadMessage(pluginFolder, this.params.breakOnStart);
        console.log(`Sending "Load Plugin" command to apps ${JSON.stringify(applicableAppsForLoading)}`);
        const loadReqProm = this.sendMessageToAppsWithReply(applicableAppsForLoading, loadJsonMsg);
        return loadReqProm.then((results) => {
            let failCount = 0;
            const successfulLoads = [];
            for (const result of results) {
                if (!result.success) {
                    ++failCount;
                    console.error(`Failed to load the plugin in app id ${result.app.id} and version ${result.app.version}`);
                } else {
                    successfulLoads.push(result);
                }
            }
            if (failCount === results.length) {
                // all reqs have failed so mark this promise as failed
                if (failCount === 1) {
                    // only one app - just use the error code here -
                    throw results[0].err;
                }
                throw new Error("Plugin Load command failed. Failed to load in any of the connected apps");
            }
            return this._handlePluginLoadSuccess(successfulLoads);
        });
    }

    _handlePluginLoadSuccess(pluginLoadResults) {
        // create a plugin session for these currently loaded plugins and commit that session
        // to a uxprc file so as to persist the state for later commands ( like plugin debug/log et al)
        this.pm._createPluginSession(pluginLoadResults);
        this.pm._saveCurrentPluginSession();
        if (this.params.breakOnStart) {
            console.log('The loading of the plugin is blocked. Waiting for a debugger to be launched.');
            return this.pm.debugPlugin(this.params).then((res) => {
                console.log("Launched standalone Chrome Developer Tools window.");
                return res;
            });
        }
        return true;
    }
}

module.exports = PluginLoadCommand;
