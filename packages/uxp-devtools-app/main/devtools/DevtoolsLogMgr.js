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

const winston = require("winston");
require("winston-daily-rotate-file");
const { getAppDataFolder } = require("./CommonUtils");
const path = require("path");

function getAppLogsDirectory() {
    const appDataFolder = getAppDataFolder();
    return path.resolve(appDataFolder, "Logs");
}

class DevtoolsLogMgr {
    constructor() {
        this._initializeWinstonLogger();
    }

    _initializeWinstonLogger() {
        const fileTransport = new (winston.transports.DailyRotateFile)({
            filename: "appLogs-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "5m",
            maxFiles: "10d",
            dirname: getAppLogsDirectory()
        });

        const logger = winston.createLogger({
            level: "verbose",
            transports: [
                fileTransport
            ]
        });
        this._logger = logger;
    }

    _logCommon(entity, type, message, otherArgs) {
        try {
            // console.log(`${type} :: ${message}`);
            const args = otherArgs || [];
            const logType = type == "log" ? "info" : type;
            this._logger[logType](`${entity} : ${message}`, ...args);
        }
        catch (err) {
            console.error("Uxp Devtools Failed to log event "  + message);
        }
    }

    logMainEvent(type, message, args) {
        this._logCommon("main", type, message, args);
    }

    logAppEvent(type, message, args) {
        this._logCommon("ui", type, message, args);
    }
}

module.exports = new DevtoolsLogMgr;
