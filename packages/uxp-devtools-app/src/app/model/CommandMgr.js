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


import AddPluginCommand from "./commands/AddPluginCommand";
import LoadPluginCommand from "./commands/LoadPluginCommand";
import UnloadPluginCommand from "./commands/UnloadPluginCommand";
import ReloadPluginCommand from "./commands/ReloadPluginCommand";
import DebugPluginCommand from "./commands/DebugPluginCommand";
import RemovePluginCommand from "./commands/RemovePluginCommand";
import InitPluginCommand from "./commands/InitPluginCommand";
import PluginOptionsCommand from "./commands/PluginOptionsCommand";
import EnableDevtoolsCommand from "./commands/EnableDevtoolsCommand";
import DisableDevtoolsCommand from "./commands/DisableDevtoolsCommand";
import PluginLogsCommand from "./commands/PluginLogsCommand";
import PackagePluginCommand from "./commands/PackagePluginCommand";
import { WatchPluginCommand, UnWatchPluginCommand } from "./commands/WatchMgrCommand";

class CommandMgr {
    constructor() {
        this.commandMap = new Map;
        this.registerCommands();
    }
    registerCommands() {
        this.commandMap.set("enableDevtools", EnableDevtoolsCommand);
        this.commandMap.set("disableDevtools", DisableDevtoolsCommand);
        this.commandMap.set("addPlugin", AddPluginCommand);
        this.commandMap.set("loadPlugin", LoadPluginCommand);
        this.commandMap.set("unloadPlugin", UnloadPluginCommand);
        this.commandMap.set("reloadPlugin", ReloadPluginCommand);
        this.commandMap.set("debugPlugin", DebugPluginCommand);
        this.commandMap.set("removePlugin", RemovePluginCommand);
        this.commandMap.set("initPlugin", InitPluginCommand);
        this.commandMap.set("loadOptionsPlugin", PluginOptionsCommand);
        this.commandMap.set("pluginLogs", PluginLogsCommand);
        this.commandMap.set("packagePlugin", PackagePluginCommand);
        this.commandMap.set("watchPlugin", WatchPluginCommand);
        this.commandMap.set("unWatchPlugin", UnWatchPluginCommand);
    }

    performCommand(controller, commandName, params) {
        return this._performCommandImpl(controller, commandName, params);
    }

    executePluginCommand(controller, plugin, commandName, params) {
        return this.performCommand(controller, commandName, {
            plugin,
            params
        });
    }

    executeAppCommand(controller, commandName, params) {
        return this.performCommand(controller, commandName, params);
    }

    _performCommandImpl(controller, commandName, params) {
        if (!this.commandMap.has(commandName)) {
            throw new Error(`Command with name ${commandName} is Invalid`);
        }
        const cmdClass = this.commandMap.get(commandName);
        const command = new cmdClass(controller, params);
        return Promise.resolve(command.execute());
    }
}

export default new CommandMgr();
