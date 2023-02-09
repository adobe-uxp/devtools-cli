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

const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const { DevToolsError } = require("@adobe-fixed-uxp/uxp-devtools-core");

// Check for file conflicts.
function getConflictingFilesList(pluginDir, uxpPackageDir) {
    let unsafeFiles = [
        "package.json",
        "manifest.json",
        "yarn.lock",
        "package.lock.json"
    ];
    const fileNames = fs.readdirSync(pluginDir);
    unsafeFiles = fs.readdirSync(uxpPackageDir);
    const conflictingNames = _.intersection(fileNames, unsafeFiles);
    return conflictingNames;
}

function sanityCheckPluginDirectory(pluginDir, uxpPackageDir) {
    // Check user has read/write access to the directory.
    try {
        fs.accessSync(pluginDir, fs.constants.W_OK | fs.constants.R_OK);
    }
    catch (error) {
        return ({ success: false , error: DevToolsError.ErrorCodes.INVALID_PERMISSIONS });
    }

    // Check if directory has conflicting files.
    const conflictingNames = getConflictingFilesList(pluginDir, uxpPackageDir);
    if (conflictingNames.length > 0) {
        console.log(`The directory ${pluginDir} contains files that could conflict: ${conflictingNames.toString()}`);
        return ({ success: false , error: DevToolsError.ErrorCodes.NONEMPTY_DIRECTORY });
    }
    return ({ success: true });
}

function getTemplateDirFromName(templateName) {
    const packageName = `@adobe/uxp-template-${templateName}`;
    const packageJsonFile = `${packageName}/package.json`;
    try {
        const templatePackageDir = require.resolve(packageJsonFile);
        return path.dirname(templatePackageDir);
    }
    catch (err) {
        throw new Error(`Invalid Template Name ${templateName}. `);
    }
}

function initWithBundledPluginTemplate(pluginDir, templateName) {
    try {
        const tempalteDir = getTemplateDirFromName(templateName);
        const uxpPackageDir = path.resolve(tempalteDir, "template");
        const checkDir = sanityCheckPluginDirectory(pluginDir, uxpPackageDir);
        if (!checkDir.success) {
            return checkDir;
        }
        fs.copySync(uxpPackageDir, pluginDir);
        return ({ success: true });
    }
    catch (err) {
        return ({ success: false , error: err });
    }
}

module.exports = {
    initWithBundledPluginTemplate
};
