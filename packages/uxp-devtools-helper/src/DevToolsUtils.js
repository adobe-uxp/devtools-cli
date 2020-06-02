/* eslint-disable global-require */
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

const path = require("path");
const fs = require("fs");

function getUxpDeveloperConfigFilePath() {
    let baseFolder = "";
    if (process.platform === "win32") {
        baseFolder = process.env.CommonProgramFiles;
    } else {
        baseFolder = `/Library/Application Support`;
    }
    baseFolder = path.join(baseFolder, "/Adobe/UXP/");
    const relativePath = "developer/settings.json";
    return {
        baseFolder,
        relativePath,
    };
}


function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

function waitForKey(keyNames) {
    const deferred = createDeferredPromise();

    const readline = require("readline");
    const rl = readline.createInterface(process.stdin);
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (c, k) => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        rl.close();
        if (keyNames.includes(k.name)) {
            deferred.resolve(true);
            return;
        }
        deferred.resolve(false);
    });
    return deferred.promise;
}

function promptUserForTermsAccept(enable) {
    if (enable) {
        console.log(`\nAdministrator privileges are needed to enable UXP Developer Tools on this system. By continuing you agree to `);
        console.log(`1) Adobe's Terms of Use: https://www.adobe.com/legal/terms.html`);
        console.log(`2) Adobe Developer Additional Terms: http://www.adobe.com/go/developer-terms`);
    } else {
        console.log(`\nAdministrator privileges are needed to disable UXP Developer Tools on this system`);
    }

    console.log('Press Enter to Continue...');
    return waitForKey(["return", "enter"]);
}


function runDevToolsCommand(enable) {
    const sudo = require('sudo-prompt');

    const devToolCommandPath = path.resolve(__dirname, "devtools/command.js");
    const action = enable ? "enable" : "disable";

    const configParams = getUxpDeveloperConfigFilePath();
    const dirArgsList = [configParams.baseFolder,  configParams.relativePath];
    const dirArgs = dirArgsList.join(";;");
    const fullCommand = `node "${devToolCommandPath}" ${action} "${dirArgs}"`;

    const options = {
        name: "Adobe UXP Devtools CLI",
    };

    const deferred = createDeferredPromise();
    // console.log(`Executing devtools command via sudo ${fullCommand}`);
    sudo.exec(fullCommand, options,
        (error) => {
            if (error) {
                console.error(`devtools command failed ${error}`);
                deferred.reject(error);
                return;
            }
            deferred.resolve(true);
        });
    return deferred.promise;
}

function devToolsCommandRunner(enable) {
    return promptUserForTermsAccept(enable).then((accept) => {
        if (accept) {
            return runDevToolsCommand(enable);
        }
        return false;
    });
}

function getUxpDeveloperConfigFullPath() {
    const configParams = getUxpDeveloperConfigFilePath();
    const configFileFullPath = path.join(configParams.baseFolder, configParams.relativePath);
    return configFileFullPath;
}

function isUxpDevToolsEnabled() {
    const configFilePath = getUxpDeveloperConfigFullPath();
    try {
        if (fs.existsSync(configFilePath)) {
            const contents = fs.readFileSync(configFilePath, "utf8");
            const config = JSON.parse(contents);
            return config.developer === true;
        }
    // eslint-disable-next-line no-empty
    } catch (err) {
    }
    return false;
}

function isDevToolsEnabled() {
    return Promise.resolve(isUxpDevToolsEnabled());
}

module.exports = {
    devToolsCommandRunner,
    isDevToolsEnabled,
};
