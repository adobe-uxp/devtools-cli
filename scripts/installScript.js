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

const fs = require("fs");
const path = require("path");
const { getUxpGlobalLocation, getYarnGlobalBinFolder } = require("./common");
/**
 * NOTE: This scripts gets called post install. We will use this create a sym link to
 * main script file (uxp.js) in the npm global bin folder.
 * This is mainly done to simulate `npm install -g @adobe/uxp` command
 * Given that we don't have this repo published to npm registry yet.
 * Users will directly download the zip of the package and will run `yarn install` on it.
 * This setup will be run as post-install step.
 */

function checkYarnBinFolderInPath() {
    const yarnBinPath = getYarnGlobalBinFolder();
    if (!process.env.PATH.includes(yarnBinPath)) {
        console.error("Yarn global bin folder is not exported in PATH environment variable. `uxp` command might be not be directly available from the terminal.");
        console.log("Please add the yarn global bin folder to PATH environment variable to access `uxp` command directly from terminal.");
    }
}

function isSymLinkExists(symPath) {
    try {
        const res = fs.lstatSync(symPath);
        return res.isSymbolicLink();
    }
    catch (err) {
        console.log("symlink exists failed " + err);
    }
    return false;
}


function installUxpCliScriptForMac() {
    const { mainScriptFile, uxpBinPath } = getUxpGlobalLocation();
    console.log(`Creating sym-link to uxp main script file in global bin folder ${uxpBinPath}`);
    fs.chmodSync(mainScriptFile, 0o755);
    if (isSymLinkExists(uxpBinPath)) {
        fs.unlinkSync(uxpBinPath);
    }
    fs.symlinkSync(mainScriptFile, uxpBinPath, "file");

    checkYarnBinFolderInPath();
}

function installUxpCliScriptForWin() {
    const { mainScriptFile, uxpBinPath } = getUxpGlobalLocation();
    console.log(`Creating batch file to uxp main script file in global bin folder ${uxpBinPath}`);
    fs.chmodSync(mainScriptFile, 0o755);

    const mainScriptWithoutExtension = path.resolve(path.dirname(mainScriptFile), path.basename(mainScriptFile, ".js"));

    /* On Windows, npm creates the wrapper batch file (*.cmd) based on whatever
       shell/interpreter is specified in the script file's shebang line.
       This is done because Windows doesn't support shebang lines */
    const fileContent = `@echo off
                         @SETLOCAL
                         @SET PATHEXT=%PATHEXT:;.JS;=;%
                         node ${mainScriptWithoutExtension} %*`;
    const filePath = `${uxpBinPath}.cmd`;
    fs.writeFileSync(filePath, fileContent, "utf8");

    checkYarnBinFolderInPath();
}

const isWindows = process.platform === "win32";
if (isWindows) {
    installUxpCliScriptForWin();
}
else {
    installUxpCliScriptForMac();
}
