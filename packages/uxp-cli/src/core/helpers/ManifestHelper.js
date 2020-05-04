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

class ManifestHelper {
    static validateManifest(manifestPath) {
        if (!fs.existsSync(manifestPath)) {
            let isValid = false;
            let details = [];
            details.push("Failed to load plugin because the manifest couldn't be located.");
            details.push("Command \"plugin load\" failed. Error: ENOENT: no such directory..");
            return {
                isValid,
                details
            }
        }
        const contents = fs.readFileSync(manifestPath, "utf8");
        const manifestJson = JSON.parse(contents);
        let hostArray = manifestJson.host;
        let isValid = false;
        const details = [];
        if (hostArray) {
            if (!Array.isArray(hostArray)) {
               hostArray = [hostArray];
            }   
            const hostAppIds = hostArray.filter((host) => !!host.app).map((host) => host.app);
            if (hostAppIds.length) {
                isValid = true;
            } else {
                details.push("Manifest `host` doesn't contain any `app` entry in it.");
            }
        } else {
            details.push('`host` entry is missing in the manifest');
        }
        const report = {
            isValid,
            manifest: manifestJson,
            details,
        };
        return report;
    }
}

module.exports = ManifestHelper;
