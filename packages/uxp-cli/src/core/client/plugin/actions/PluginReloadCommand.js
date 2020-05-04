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
        return this.runCommandOnAllApplicableApps(createReloadMessage);
    }
}


module.exports = PluginReloadCommand;
