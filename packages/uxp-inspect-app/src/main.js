#!/usr/bin/env node
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
/* eslint-disable global-require */

const process = require("process");

function launchUxpInspectElectronApp(...inArgs) {
    const path = require('path');
    const proc = require('child_process');

    function getElectronPath() {
        const productName = "Adobe UXP Inspect";
        const baseFolder = `/${productName}-${process.platform}-${process.arch}/`;
        let executablePath = "";
        if (process.platform === "darwin") {
            executablePath = `${baseFolder}${productName}.app/Contents/MacOS/${productName}`;
        } else if (process.platform === "win32") {
            executablePath = `${baseFolder}${productName}.exe`;
        }
        return path.join(__dirname, '../out', executablePath);
    }

    function launchDebugApp(...args) {
        // console.log(`debug args are ${JSON.stringify(args)}`);
        const child = proc.spawn(getElectronPath(), args, { stdio: 'inherit', windowsHide: false });
        child.on('close', (code) => {
            process.exit(code);
        });

        const handleTerminationSignal = function (signal) {
            process.on(signal, () => {
                if (!child.killed) {
                    child.kill(signal);
                }
            });
        };
        handleTerminationSignal('SIGINT');
        handleTerminationSignal('SIGTERM');
    }

    launchDebugApp(...inArgs);
}

function runMainAppInsideElectron() {
    require("./main/index");
}

const isRunningInsideElectron = !!(process.versions && process.versions.electron);

module.exports = isRunningInsideElectron ? runMainAppInsideElectron() : launchUxpInspectElectronApp;
