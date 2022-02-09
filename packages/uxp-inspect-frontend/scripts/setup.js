/*
 * Copyright 2020 Adobe Systems Incorporated. All rights reserved.
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
const fs = require("fs-extra");
const tar = require("tar");

function extractTarLib(tarPath, destDir) {
    return tar.extract({
        file: tarPath,
        cwd: destDir
    });
}

function setupFrontEnd() {
    try {
        console.log("Started setting up the UXP Inspect App.");
        const tarFileName = path.join(__dirname, "front_end.tar.gz");
        const destDir = path.join(__dirname, "..", "main");
        const fileName = path.join(destDir, "front_end");
        if (fs.existsSync(fileName)) {
            console.log("removing existing files");
            fs.removeSync(fileName, { recursive: true });
        }
        console.log("extracting", tarFileName, "to", destDir);
        extractTarLib(tarFileName, destDir);
        console.log("setting up of inspect frontend done");
    }
    catch (err) {
        console.log("error while setting up inspect frontend", err);
    }
}


setupFrontEnd();
