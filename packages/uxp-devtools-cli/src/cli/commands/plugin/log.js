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


const debugCommand = require("./debug");

// we are going to leverage the debug command for Logs commnad -
// Logs command is supposed to launch the CDT Inspect with only Console Tab in it.
// Debug command internally takes this option to handle the console case.

function handlePluginLogsCommand(args) {
    // set the forConsole to true - so that we show only the Console Tab in the CDT Inspect for Logs.
    args.forConsole = true;
    return debugCommand.handler(args);
}

const logOptions = {
    apps: {
        describe: "If you plugin is loaded in multiple apps, you can use this option to limit the Apps this command will run on.",
        type: "string",
    },
};

const logCommand = {
    command: "logs",
    description: "Show Plugin Logs Window",
    handler: handlePluginLogsCommand,
    builder: logOptions,
};

module.exports = logCommand;
