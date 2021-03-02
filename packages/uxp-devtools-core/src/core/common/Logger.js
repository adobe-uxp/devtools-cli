/* eslint-disable no-unused-vars */
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

const { LoggerLevel } = require("./Utils");

class Logger {
    constructor() {
        this._level = LoggerLevel.DEFAULT;
        this.init();
    }

    init()  {
        const methods = [ {
            name: "error",
            level: LoggerLevel.ERROR
        },{
            name: "warn",
            level: LoggerLevel.WARN
        },{
            name: "log",
            level: LoggerLevel.INFO
        },{
            name: "verbose",
            level: LoggerLevel.VERBOSE
        } ];

        for (let i = 0; i < methods.length; ++i) {
            const method = methods[i];
            this[method.name] = function(msg) {
                if (this._provider) {
                    this._provider[method.name](msg);
                    return;
                }
                if (this._level < method.level) {
                    return; // log-level severity is more so ignore.
                }
                const consoleMethodName = method.name == "verbose" ? "log" : method.name;
                console[consoleMethodName](msg);
            };
        }
    }

    get level() {
        return this._level;
    }

    setProvider(provider) {
        this._provider = provider;
    }

    set level(level) {
        this._level = level;
    }
}


module.exports = new Logger();
