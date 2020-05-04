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
const { execSync } = require("child_process");

function runCDTSetup() {
    require("./setup-cdt-uxp");
}


/** Note: we could have just adding the `yarn package` command to the package.json file of uxp-inpect-app itselff.
 * But that is failing on Windows in weird ways - may be the commnad is inheriting some evn variables which are not compatible and fails with som
 * symlink errors - But the same yarn package command runs fine when executed seperately,
 * So, to simulate the same - we are doing that here. Spawning a seperate `yarn pacakge` command
 */
function runElectronPackage() {
    const inspectBaseFolder = path.resolve(__dirname, "../");
    const command = "yarn package";
    execSync(command, null, {
        cwd: inspectBaseFolder,
    });
}

runCDTSetup();
runElectronPackage();
