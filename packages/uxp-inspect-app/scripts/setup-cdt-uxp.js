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

/**
 * Note: This scirpts sets up the Chrome frontend Inspect component tailored for UXP Plugin Inspect
 * Chrome Inspect by default has lot of features ( TABs ) which are not relevant for UXP.
 * for eg: Tabs like Application, Security, Audits are not relevant for UXP.
 * Other tabs like, Network, Performance, Memory are currently not supported in UXP devtools - so, we are
 * disabling those tabs as well for now and will enale them when relevant support is added.
 *
 * How:
 * Chrome-Front-End seems to be structured in a very nice modular way where it picks up the TABs via JSON configuration files.
 * So, we can easily tinker those configration files to enable disable features.
 * The main file for inspect window is the devtools_app.json file - this file specifies features like Performance_monitor, network
 * web_audio, media etc - which we have removed and generated a new json configuration keeping onyl which are relevant.
 *
 * shell.json configuration file.
 *
 * This file is extended by devtools_app file and contains features which are not required for UXP inspect and hence we need to remove
 * certain entries from this file as well - for eg:  { "name": "protocol_monitor"},  { "name": "settings" } etc.
 *
 * We have kept these two pre-backed in this scripts folder and we will just copy them ( override ) into the required destination
 *
 * NOTE NOTE : the version of CDT this json configuration is compatible with is
 * "chrome-devtools-frontend": "1.0.672485"
 * If you change the frontend version - then you need to pick the latest devtools_app and shell json configuration files from new version and need to manually edit out entries
 * test them out to see if only required tabs are showing up and then use them here.
 *
 *  NOTE2 : note that we are not hoisting the chrome-front-end package in the root's package json file by doing
 * "nohoist": ['**chrome-devtools-frontend', '**chrome-devtools-frontend**']
 * The reason is we need to package this library in electron app - and build configuration picks up these files from node_moudles folder of uxp-inpsect-app package.
 *
 */

const path = require("path");
const fs = require("fs");

function getChromeFrontEndPackageFolderPath() {
    function getCDTPackagePath(dirPath) {
        const cdtPackage = path.resolve(dirPath, "chrome-devtools-frontend");
        const exists = fs.existsSync(cdtPackage);
        return exists ? cdtPackage : null;
    }

    let nodeModulesPath = path.resolve(__dirname, "../node_modules");
    let cdtPackagePath = getCDTPackagePath(nodeModulesPath);
    if (cdtPackagePath) {
        return cdtPackagePath;
    }

    nodeModulesPath = path.resolve(__dirname, "../../../node_modules");
    cdtPackagePath = getCDTPackagePath(nodeModulesPath);

    if (!cdtPackagePath) {
        throw new Error("Chrome-developer-frontend is not present. Uxp Debug inspect will not work. Make sure npm install or yarn install is run");
    }
    return cdtPackagePath;
}

function overrideChromeFrontEndFeatures() {
    const cdtPackagePath = getChromeFrontEndPackageFolderPath();
    const frontEndDir = path.resolve(cdtPackagePath, "front_end");

    const sourceDataDir = path.resolve(__dirname, "cdt-frontend-data");
    const uxpDevToolsJsonSrc = path.resolve(sourceDataDir, "devtools_app.json");
    const uxpShellJsonSrc = path.resolve(sourceDataDir, "shell.json");

    const uxpDevToolsJsonDest = path.resolve(frontEndDir, "devtools_app.json");
    const uxpShellJsonDest = path.resolve(frontEndDir, "shell.json");

    fs.copyFileSync(uxpDevToolsJsonSrc, uxpDevToolsJsonDest);
    fs.copyFileSync(uxpShellJsonSrc, uxpShellJsonDest);
}

overrideChromeFrontEndFeatures();
