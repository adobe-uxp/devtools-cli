/* eslint-disable import/no-dynamic-require */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable global-require */
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

const userInput = {};
const prompts = require('prompts');
const semver = require('semver');
const path = require('path');
const fs = require('fs-extra');

const chalk = require('chalk');

const questions = require('./manifestQuestions');

const supportedAppList = [
    'PS',
    'XD',
];

const idQuestion = [
    {
        type: 'confirm',
        message: 'Do you want to update the plugin id?',
        name: 'confirm',
    },
    {
        type: (prev, values) => {
            if (values.confirm) {
                return 'text';
            }
            return null;
        },
        message: 'Plugin Id ?',
        name: 'pluginId',
    },

];

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
    }
}


function getManifetJson(root) {
    const manifestPath = path.join(root, 'manifest.json');
    const manifestJson = require(manifestPath);
    return manifestJson;
}

function checkValidHostApp(host) {
    let isValidHostApp = false;

    if (host) {
        // Host may conatin app list.
        if (Array.isArray(host)) {
            host.forEach((hostApp) => {
                // Found valid host.
                if (supportedAppList.includes(hostApp.app)) {
                    isValidHostApp = true;
                }
            });
        } else if (host.app && supportedAppList.includes(host.app)) {
            isValidHostApp = true;
        }
    }
    return isValidHostApp;
}

function updateManifestJson(root, manifestJson) {
    const manifestPath = path.join(root, 'manifest.json');
    fs.writeFileSync(
        manifestPath,
        JSON.stringify(manifestJson, null, 2),
    );
    console.log(
        chalk.green('\nmanifest.json successfully updated.\n'),
    );
    return ({ success: true });
}

function checkAppsInJson(root) {
    const manifestJson = getManifetJson(root);
    const { host } = manifestJson;

    let isValidHostAppPresent = false;
    if (host) {
        isValidHostAppPresent = checkValidHostApp(host);
    }

    if (!isValidHostAppPresent) {
        console.log(
            `The ${chalk.cyan(`manifest.json`)} does not contain any supported application for the plugin. Please add atleast one application.\n`,
        );

        // Prepare user questions.
        const questionList = ['host', 'psversion', 'xdversion'];
        const hostQuestions = [];
        for (let i = 0; i < questions.length; i++) {
            const ques = questions[i];
            if (questionList.includes(ques.name)) {
                hostQuestions.push(ques);
            }
        }

        const prom = prompts(hostQuestions, { onSubmit });

        return prom.then((response) => {
            manifestJson.host = userInput.host;
            return updateManifestJson(root, manifestJson);
        });
    }

    return ({ success: true });
}


function updatePluginId(root) {
    const manifestJson = getManifetJson(root);
    if (manifestJson) {
        const pluginId = manifestJson.id;

        // Link to generate unique plugin id for user.
        console.log(`\nPre-installed plugin id is : ${chalk.cyan(pluginId)}`);
        console.log(
            `\nIt is advised to generate a unique plugin id for every plugin. If you do not have a plugin id, use the below link to generate an id. \n`,
        );
        console.log(
            chalk.cyan('\thttps://console.adobe.io/projects\n'),
        );

        const idPromise = prompts(idQuestion);
        return idPromise.then((response) => {
            // User wants to update the pluginId.
            if (response.confirm) {
                manifestJson.id = response.pluginId;
                return updateManifestJson(root, manifestJson);
            }
            return ({ success: true });
        });
    }
    throw Error('manifest.json not found.');
}

module.exports = {
    checkAppsInJson,
    updatePluginId,
};
