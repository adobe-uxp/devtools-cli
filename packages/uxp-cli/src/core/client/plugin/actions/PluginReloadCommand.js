/* eslint-disable max-len */
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

const PluginBaseCommand = require("./PluginBaseCommand");

function createReloadMessage(pluginSessionId) {
    const msg = {
        command: "Plugin",
        action: "reload",
        pluginSessionId,
    };
    return msg;
}

class PluginReloadCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    get name() {
        return "Reload";
    }

    validateParams() {
        this.params = {
            apps: [],
        };
        return Promise.resolve(true);
    }

    executeCommand() {
        const resultsCallback = this._handlePluginReloadResult.bind(this);
        return this.runCommandOnAllApplicableApps(createReloadMessage, resultsCallback);
    }

    breakOnStartEnabled(result) {
        const { data } = result;
        return data && data.breakOnStart;
    }

    _handlePluginReloadResult(results) {
        if (results.length > 0) {
            if (this.breakOnStartEnabled(results[0])) {
                console.log('The loading of the plugin is blocked. Waiting for a debugger to be launched.');
                return this.pm.debugPlugin(this.params).then((res) => {
                    console.log("Launched standalone Chrome Developer Tools window.");
                    return { "breakOnStart" : true, res };
                });
            }
        }
        return true;
    }
}


module.exports = PluginReloadCommand;
