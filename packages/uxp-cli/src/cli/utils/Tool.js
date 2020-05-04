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

/* eslint-disable func-names */
/* eslint-disable global-require */

const log = require("./log");

class Tool {
    constructor(uxp, modules) {
        this.Tool = Tool;
        this.uxp = uxp;
        this.log = log;
        this._commands = modules;
    }

    run(args) {
        // Make sure we don't accept paramaters that are not defined.
        const toolThiz = this;
        const yargs = require("yargs/yargs")(args);
        yargs.strict(true);
        const origYargsCommand = yargs.command;
        // wrap the command handler into common one - we can inject common objects here -
        // and also handle any errors etc.
        yargs.command = function (mod) {
            const module = mod;
            const wrapHandler = function (handler) {
                if (!handler) {
                    return null;
                }
                return function (...handlerArgs) {
                    // return a promise object -
                    const prom = new Promise((resolve) => {
                        resolve(handler.call(toolThiz, ...handlerArgs));
                    });
                    return prom.then((res) => ({
                        result: 0,
                        data: res,
                    })).catch((err) => {
                        // eslint-disable-next-line no-underscore-dangle
                        console.error(`Command '${toolThiz._currentCommand}' failed. ${err}`);
                        // crajTODO - check if tests gets affected by setting this.
                        process.exitCode = 1;
                        return {
                            result: 1,
                            error: err,
                        };
                    });
                };
            };
            module.handler = wrapHandler(module.handler);
            return origYargsCommand(module);
        };

        for (const command of this._commands) {
            yargs.command(command);
        }

        // eslint-disable-next-line no-unused-vars
        const params = yargs.help().recommendCommands().argv;
        const cmds = params._;
        if (!cmds.length) {
            yargs.showHelp();
            return;
        }
        this._currentCommand = cmds.join(' ');
    }
}

module.exports = Tool;
