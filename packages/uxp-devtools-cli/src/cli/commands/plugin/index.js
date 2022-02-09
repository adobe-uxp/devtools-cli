/* eslint-disable max-len */
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

const loadCommand = require("./load");
const debugCommand = require("./debug");
const reloadCommand = require("./reload");
const unloadCommand = require("./unload");
const logCommand = require("./log");
const initCommand = require("./init");
const validateCommand = require("./validate");
const packageCommand = require("./package");
const watchCommand = require("./watch");
const testCommand = require("./pluginTest");


function registerPluginSubCommands(yargs) {
    return yargs.command(loadCommand).command(debugCommand)
        .command(reloadCommand).command(logCommand).command(initCommand)
        .command(validateCommand).command(unloadCommand).command(watchCommand)
        .command(packageCommand).command(testCommand);
}

const PluginCommand = {
    command: "plugin <command>",
    description: "Load, reload, watch, debug, unload, test, package, validate plugins",
    builder: registerPluginSubCommands,
};

module.exports = PluginCommand;
