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

const _ = require("lodash");
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const homedir = require('os').homedir();
const process = require('process');
const PluginBaseCommand = require("./PluginBaseCommand");

function getPsLogDirectory() {
    if (process.platform === 'darwin') {
        return path.join(
            homedir,
            'Library',
            'Logs',
            'Adobe',
            'Adobe Photoshop 2020',
        );
    }

    if (process.platform === 'win32') {
        return path.join(
            process.env.Appdata,
            'Adobe',
            'Adobe Photoshop 2020',
            'Logs',
        );
    }
    // throw new Error("Platform not Supported");
    return null;
}

function getLatestFile(logDirectoryPath) {
    try {
        const files = fs.readdirSync(logDirectoryPath);
        let latestFile = [];

        latestFile = files.filter((_file) => _file.startsWith('UXP'))
            .filter((_file) => _file.endsWith('.log'))
            .map((_file) => ({ stat: fs.statSync(path.join(logDirectoryPath, _file)), name: _file }))
            .filter((_file) => _file.stat.isFile())
            .sort((a, b) => b.stat.mtime - a.stat.mtime)
            .map((_file) => _file.name);

        if (latestFile.length > 0) {
            return latestFile[0];
        }
        return null;
    } catch (error) {
        return null;
    }
}

function constructPsLogPath() {
    const logDirectory = getPsLogDirectory();
    if (!!logDirectory) {
        const latestFile = getLatestFile(logDirectory);
        if (!!latestFile) {
            return (path.join(logDirectory, latestFile));
        }
    }
    return null;
}

function constructDemoAppPath() {
    return null;
}

const AppDetails = [
    { id: 'PS', name: 'Adobe Photoshop', logPathHandler: constructPsLogPath },
    { id: 'UXPD', name: 'DemoApp', logPathHandler: constructDemoAppPath },
];

const SupportedAppsList = [
    'PS',
    'UXPD',
];

class PluginLogCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    validateParams() {
        this.params = this.params || {};
        this.params.apps = this.params.apps || [];
        return Promise.resolve(true);
    }

    executeCommand() {
        const { applicableAppsList } = this.getSessionDetailsOfApplicableApps(this.params.apps);

        // List of Supported and Unsupported Apps
        const notSupportedAppList = applicableAppsList.filter((app) => !SupportedAppsList.includes(app.id.toUpperCase())) || [];
        const supportedAppList = applicableAppsList.filter((app) => SupportedAppsList.includes(app.id.toUpperCase())) || [];

        if (notSupportedAppList.length > 0) {
            console.log(`The devtools currently do not support the ${chalk.cyan("log query")} command in:`);
            console.log(chalk.cyan(notSupportedAppList.map((app) => app.id)));
        }

        if (supportedAppList.length > 0) {
            supportedAppList.forEach((app) => {
                const handler = AppDetails.filter((x) => x.id === app.id.toUpperCase())[0].logPathHandler;
                const logPath = handler.call(this);
                if (!!logPath) {
                    console.log(`  ${chalk.green(app.id)} : ${chalk.cyan(logPath)}`);
                } else {
                    console.log(`  ${chalk.green(app.id)} : ${chalk.red(`Log path not found.`)}`);
                }
            });
            return Promise.resolve(true);
        }
        throw new Error('No supported app found for the plugin');
    }
}


module.exports = PluginLogCommand;
