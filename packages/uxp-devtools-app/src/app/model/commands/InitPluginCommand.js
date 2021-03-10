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

import fs from "fs";
import BaseCommand from "./BaseCommand";

const path = require("path");
const _ = require("lodash");
const templates = {
    psStarterMod: {
        name: "ps-starter",
        value: require("@adobe/uxp-template-ps-starter")
    },
    defaultPsStarterMod : {
        name: "default-starter-ps",
        value: require("@adobe/uxp-template-default-starter-ps")
    },
    reactStarterMod : {
        name: "ps-react-starter",
        value: require("@adobe/uxp-template-ps-react-starter")
    },
    reactTypescriptMod : {
        name: "ps-react-typescript",
        value: require("@adobe/uxp-template-ps-react-typescript")
    },
    xdStarterMod : {
        name: "xd-starter",
        value: require("@adobe/uxp-template-xd-starter")
    },
    defaultXdStarterMod : {
        name: "default-starter-xd",
        value: require("@adobe/uxp-template-default-starter-xd")
    },
};

let kPredefinedUxpTempaltes = null;

const ErrorCode = {
    ALREADY_ADDED: 1,
    DIALOG_CANCELLED: 2,
    INVALID_PERMISSIONS: 3,
    NONEMPTY_DIRECTORY: 4
};

// we always looks for directory named "template" within the uxp template package directory.
// this is enforced and plugin template creators should follow this rule.
const TEMPLATE_DIR = "template";

function registerPrebundledUxpTemplate() {
    if (kPredefinedUxpTempaltes) {
        return;
    }
    kPredefinedUxpTempaltes = new Map();
    // For now, we are hardcoding the module names here so that its get bundled into the package.
    // TODO (craj) - we need to handle this in a proper way -
    _.forOwn(templates, (v) => {
        kPredefinedUxpTempaltes.set(v.name, v.value);
    });
}

function getTemplateModule(templateName) {
    if (kPredefinedUxpTempaltes.has(templateName)) {
        return kPredefinedUxpTempaltes.get(templateName);
    }

    throw new Error(`Invalid Template name ${templateName}.`);
}

function updateManifest(devtools, params) {
    let manifestJson = path.join(params["pluginDir"], devtools.manifestPath || "manifest.json");
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestJson));
        if (manifest) {
            manifest.id = params["id"] || manifest.id;
            manifest.version = params["version"] || manifest.version;
            manifest.name = params["name"] || manifest.name;
            manifest.host = params["host"] || manifest.host;
            fs.writeFileSync(manifestJson, JSON.stringify(manifest, null, 2));
            return ({ success: true });
        }
    }
    catch(err) {
        return ({ success: false , error: err });
    }
}

// fs-extra copy is not working correctly for subdirectories. User is unable to view the folder in finder due to restricted permissions
// hence using this recursive copy function
var copyRecursiveSync = function(src, dest) {
    try {
        var exists = fs.existsSync(src);
        if (!exists) {
            throw new Error("Src files not found.");
        }
        var stats = exists && fs.lstatSync(src);
        var isDirectory = exists && stats.isDirectory();
        if (isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            fs.readdirSync(src).forEach(function(childItemName) {
                copyRecursiveSync(path.join(src, childItemName),
                    path.join(dest, childItemName));
            });
        }
        else {
            // Electron builder ignores the package-lock.json file while packaging - hence to workaround that we name the file as uxp-package-lock and rename it back when setting up the template in the final user directory.
            let destName = dest;
            if (path.basename(dest) == "uxp-package-lock.json") {
                destName =  path.resolve(path.dirname(dest), "package-lock.json");
            }
            fs.copyFileSync(src, destName);
        }
        return ({ success: true });
    }
    catch(err) {
        throw new Error("Folder Copy Failed with error : " + err);
    }
};

// Check for file conflicts.
function getConflictingFilesList(params) {
    let unsafeFiles = [
        "package.json",
        "manifest.json",
        "yarn.lock",
        "package.lock.json"
    ];
    const fileNames = fs.readdirSync(params.pluginDir);
    if (params.selectedTemplate) {
        const templateMod = getTemplateModule(params.selectedTemplate);
        const uxpPackageDir = path.resolve(templateMod.packageDir, TEMPLATE_DIR);
        unsafeFiles = fs.readdirSync(uxpPackageDir);
    }
    const conflictingNames = _.intersection(fileNames, unsafeFiles);
    return conflictingNames;
}

function sanityCheckPluginDirectory(params) {
    const root = params.pluginDir;
    // Check user has read/write access to the directory.
    try {
        fs.accessSync(root, fs.constants.W_OK | fs.constants.R_OK);
    }
    catch (error) {
        return ({ success: false , error: ErrorCode.INVALID_PERMISSIONS });
    }

    // Check if directory has conflicting files.
    const conflictingNames = getConflictingFilesList(params);
    if (conflictingNames.length > 0) {
        UxpAppLogger.warn(`The directory contains files that can conflict: ${conflictingNames.toString()}`);
        return ({ success: false , error: ErrorCode.NONEMPTY_DIRECTORY });
    }
    return ({ success: true });
}

function getDefaultTemplate(host) {
    const defaultPrefix = "default-starter";
    if(!Array.isArray(host)) {
        host = [ host ];
    }
    const defaultTemplate = (host && host[0].app) ? defaultPrefix + "-" + host[0].app.toLowerCase() : "";

    return defaultTemplate;
}


export default class InitPluginCommand extends BaseCommand {

    initWithBundledPluginTemplate(pluginDir, templateName) {
        const templateMod = getTemplateModule(templateName);
        const templatePackagedDir = templateMod.packageDir;
        const uxpPackageDir = path.resolve(templatePackagedDir, TEMPLATE_DIR);
        try {
            copyRecursiveSync(uxpPackageDir, pluginDir);
            return ({ success: true , devtools: templateMod.devtools || {} });
        }
        catch(err) {
            return ({ success: false , error: ErrorCode.INVALID_PERMISSIONS });
        }
    }

    async execute() {
        registerPrebundledUxpTemplate();
        const params = this.params;

        if (!params.selectedTemplate) {
            params.selectedTemplate = getDefaultTemplate(params.host);
        }

        if (!params.pluginDir || !params.selectedTemplate) {
            return Promise.reject(new Error("Init Plugin Command Failed. Invalid Params."));
        }

        const checkDir = sanityCheckPluginDirectory(params);
        if (!checkDir.success) {
            return Promise.reject({
                errorCode: checkDir.error,
            });
        }

        const checkTemplate = this.initWithBundledPluginTemplate(params.pluginDir, params.selectedTemplate);
        if (!checkTemplate.success) {
            return Promise.reject({
                errorCode: checkTemplate.error,
            });
        }

        if (params.uiFlag) {
            const response = updateManifest(checkTemplate.devtools,params);
            if (!response.success) {
                throw new Error("Unexpected error occurred in updating manifest " + response.error);
            }
        }
        return Promise.resolve(checkTemplate.devtools);
    }
}
