/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the Licrrense for the specific language
 *  governing permissions and limitations under the License.
 *
 */

const path = require('path');
const fs = require('fs');
const prompts = require('prompts');
const semver = require('semver');
const chalk = require('chalk');
const _ = require("lodash");

const { createPluginFromTemplate } = require('./init/templateCommand');
const questions = require('./init/manifestQuestions');

const currentPath = process.cwd();
const userInput = {};


function checkUserPermissions() {
    try {
        // eslint-disable-next-line no-bitwise
        fs.accessSync(currentPath, fs.constants.W_OK | fs.constants.R_OK);
    } catch (error) {
        throw new Error(`User does not have read/write access to the directory. Error: ${error}`);
    }
}

function onSubmit(prompt, answer) {
    const propertyName = prompt.name;
    const propertyValue = answer;

    if (!propertyValue) {
        return;
    }

    // Create Object for each host app.
    if (propertyName === 'host') {
        const appList = [];
        propertyValue.forEach((element) => {
            const app = {
                app: element,
                minVersion: '',
            };
            appList.push(app);
        });
        userInput.host = appList;
        return;
    }

    // Add host app supported vesrion.
    if (propertyName.includes('version')) {
        // Check for valid Plugin Id.
        if (propertyName === 'version' && semver.valid(propertyValue)) {
            userInput[propertyName] = propertyValue;
            return;
        }

        const appList = userInput.host;
        if (Array.isArray(appList) && appList.length > 0) {
            for (let i = 0; i < appList.length; i++) {
                const hostApp = appList[i];
                const appVersion = `${hostApp.app.toString().toLowerCase()}version`;
                if (propertyName === appVersion && semver.valid(propertyValue)) {
                    hostApp.minVersion = answer;
                }
            }
        }
        return;
    }

    userInput[propertyName] = propertyValue;
}

class PluginInitCommand {
    constructor(params) {
        this._params = params;
        this._data = Object.create(null);
    }

    _ensureMasterJson() {
        const manifestPath = path.join(currentPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            this._manifestJson = require(manifestPath);
            return;
        }
        this._manifestJson = {};
    }

    _confirmUserToSaveManifest() {
        console.log(chalk.green('About to write %s\n\n'), 'manifest.json');
        console.log(chalk.yellow(JSON.stringify(this._data, null, 2)));

        const question = {
            type: 'confirm',
            message: 'Is this Ok ?',
            name: 'confirm',
        };

        const writePromise = prompts(question);

        return writePromise.then((response) => {
            if (response.confirm) {
                const filePath = path.resolve(currentPath, 'manifest.json');
                fs.writeFileSync(filePath, JSON.stringify(this._data, null, 2), 'utf8');
                return {
                    success: true,
                };
            }
            throw new Error(`Aborting the manifest file creation.`);
        });
    }

    executeBasicInit() {
        // Check if user has permission to read and write in the current directory.
        checkUserPermissions();
        this._ensureMasterJson();

        const manifestProm = prompts(questions, { onSubmit });

        return manifestProm.then((response) => {
            this._data = _.merge(this._manifestJson, userInput);
            return this._confirmUserToSaveManifest(this._data);
        });
    }

    execute() {
        const { template } = this._params;

        if (template) {
            return createPluginFromTemplate(template);
        }

        return this.executeBasicInit();
    }
}

module.exports = PluginInitCommand;
