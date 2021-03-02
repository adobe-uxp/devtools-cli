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

const path = require("path");
const { execSync } = require("child_process");
const process = require("process");
/**
 * Note: We need to execute `electron-builder install-app-deps` during the postinstall step so as to generate
 * node native addons compatible for electron app.
 * Normally, we would specify this command in package.json file itself - like so
 * "postinstall": "electron-builder install-app-deps"
 * This works on Mac but this is failing on Windows - Looks like a bug in yarn tool when working in a workspace.
 * eg: https://github.com/expo/expo/issues/6983 & https://github.com/yarnpkg/yarn/issues/7694
 * As a workaround - we are calling the EB scripts direclty ourselves here.
 */

function installElectronAppDeps() {
    let uxpDevtoolAppDir =  require.resolve("@adobe/uxp-devtools-app/package.json");
    uxpDevtoolAppDir = path.dirname(uxpDevtoolAppDir);
    process.chdir(uxpDevtoolAppDir);

    execSync("yarn electron-builder install-app-deps", {
        cwd: uxpDevtoolAppDir,
        stdio: [ "inherit", "inherit", "inherit" ]
    });
}

installElectronAppDeps();
