/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
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

const PluginBaseCommand = require("./PluginBaseCommand");
const path = require("path");
const fs = require("fs");
var archiver = require("archiver");
const ignoreWalk = require("ignore-walk");

const validationSupportedApps = [ "PS", "XD" ];
const numbersRegex = /^[0-9]+$/;
const versionRegex = /^\d+(\.\d+){0,3}$/;

const PLUGIN_VERSION_LENGTH = 3;
const MANIFEST_VERSION_4 = 4;

class PluginPackageCommand extends PluginBaseCommand {

    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    validateIcons(manifest) {
        if(!Array.isArray(manifest.icons)) {
            throw new Error("Plugin icons are not specified in the manifest.");
        }

        let manifestEntryPoints = manifest.entrypoints;
        if (!manifestEntryPoints) {
            return;
        }
        manifestEntryPoints = Array.isArray(manifestEntryPoints) ? manifestEntryPoints : [ manifestEntryPoints ];
        for (const entryPoint of manifestEntryPoints) {
            if(entryPoint.type === "panel" && !Array.isArray(entryPoint.icons)) {
                throw new Error("Icons are not specified for panel entrypoints in the manifest.");
            }
        }
    }

    validatePluginNameFormat(manifest) {
        if(!(manifest.name.length >= 3 && manifest.name.length <= 45)) {
            throw new Error(`Malformed manifest: Plugin name must be between 3 and 45 characters long.`);
        }
    }
    validatePluginVersionFormat(manifest) {
        const pluginVersionParts = manifest.version.split(".");
        if(pluginVersionParts.length !== PLUGIN_VERSION_LENGTH) {
            throw new Error(`Malformed manifest: "version" is incorrectly formatted. Expected "x.y.z" form.`);
        }
    }

    validateHostMinVersion(host, expectedVersion) {
        if(!host.minVersion) {
            throw new Error("Malformed manifest: `minVersion` is not provided.");
        }
        const minVersionParts = host.minVersion.toString().indexOf(".") === -1 ? [ host.minVersion ] : host.minVersion.toString().split(".");
        if(!host.minVersion.toString().match(versionRegex)) {
            throw new Error("Malformed manifest: `minVersion` is incorrectly formatted. Expected `x.y.z` form.");
        }
        const parsedHostVersion = parseInt(minVersionParts[0]);
        if (isNaN(parsedHostVersion) || parsedHostVersion < expectedVersion) {
            throw new Error(`Failed to package plugin: packaging only supports ${host.app} \`minVersion\` of '${expectedVersion}' or higher`);
        }
    }

    validateManifestForPS(manifest, host) {
        if (!manifest.version) {
            throw new Error("Malformed manifest: missing `version`.");
        }
        if(!manifest.manifestVersion) {
            throw new Error("Malformed manifest: `manifestVersion` is not provided.");
        }
        if(!manifest.manifestVersion.toString().match(numbersRegex)) {
            throw new Error("Malformed manifest: `manifestVersion` is incorrectly formatted; it should be an integer and be 4 or higher.");
        }
        const parsedManifestVersion = parseInt(manifest.manifestVersion);
        if (isNaN(parsedManifestVersion) || parsedManifestVersion < MANIFEST_VERSION_4) {
            throw new Error("Failed to package plugin: `manifestVersion` must be 4 or higher.");
        }

        this.validateHostMinVersion(host, 22);
    }

    validateForXD(manifest, host) {
        this.validatePluginNameFormat(manifest);

        if(!manifest.manifestVersion || manifest.manifestVersion <= 3) {
            this.validateHostMinVersion(host, 13);
        }
        else {
            if(!manifest.manifestVersion.toString().match(numbersRegex)) {
                throw new Error("Malformed manifest: `manifestVersion` is incorrectly formatted; it should be an integer and be 4 or higher.");
            }
            const parsedManifestVersion = parseInt(manifest.manifestVersion);
            if (isNaN(parsedManifestVersion) || parsedManifestVersion < MANIFEST_VERSION_4) {
                throw new Error("Failed to package plugin: `manifestVersion` must be 4 or higher.");
            }
            this.validateHostMinVersion(host, 37);
        }
    }

    validateForPackaging(manifest, packagingHost) {
        if(validationSupportedApps.includes(packagingHost.app)) {
            // Validation will be done only for validationSupportedApps
            this.validatePluginVersionFormat(manifest);
            if(packagingHost.app === "PS") {
                this.validateManifestForPS(manifest, packagingHost);
                this.validateIcons(manifest);
            }
            else if(packagingHost.app === "XD") {
                this.validateForXD(manifest, packagingHost);
            }
        }
    }

    getManifestsForPackaging(manifestJson, appsList) {
        const resultManifestJsons = [];
        let hosts = manifestJson.host;

        if(!Array.isArray(hosts)) {
            hosts = [ hosts ];
        }

        let selectedHost = hosts;
        if(appsList.length) {
            selectedHost = hosts.filter(host => appsList.includes(host.app));
        }

        for (const host of selectedHost) {
            let manifest = JSON.parse(JSON.stringify(manifestJson));
            manifest.host = host;
            resultManifestJsons.push(manifest);
        }

        return resultManifestJsons;
    }

    getFilesForPackaging(sourcePath) {
        let  files = ignoreWalk.sync({
            path: sourcePath,
            ignoreFiles: [ ".gitignore", ".npmignore" ],
            includeEmpty: false,
        });

        const ignoredFiles = [ ".uxprc", ".gitignore", "yarn.lock", ".npmignore", ".DS_Store", "manifest.json", "package-lock.json" ];
        files = files.filter(function(file) {
            const fileName = file.substr(file.lastIndexOf("/") + 1);
            return !(ignoredFiles.includes(fileName) || fileName.startsWith("."));
        });

        files = files.filter(function(file) {
            return !(file.endsWith(".ccx") || file.endsWith(".xdx") || file.startsWith("uxp-plugin-tests"));
        });

        return files;
    }

    packageHost(manifestJson) {
        const prom = new Promise((resolve) => {
            const sourcePath = path.dirname(this.params.manifest);
            const files = this.getFilesForPackaging(sourcePath);
            try {
                this.validateForPackaging(manifestJson, manifestJson.host);
            }
            catch(err) {
                return resolve({
                    success: false,
                    error: new Error(`Validation failed for ${manifestJson.host.app} with ${err}`)
                });
            }
            const extension = manifestJson.host.app === "XD" ? ".xdx" : ".ccx";
            const zipFileName = manifestJson.id + "_" + manifestJson.host.app + extension;
            const zipFile = path.resolve(this.params.packageDir, zipFileName);
            const archive = archiver("zip", {
                zlib: { level: 9 }
            });
            const outputStream = fs.createWriteStream(zipFile);
            archive.append(JSON.stringify(manifestJson, null, 2), { name: "manifest.json" });
            files.forEach(file => {
                archive.append(fs.createReadStream(path.join(sourcePath, file)), { name: file });
            });
            outputStream.on("close", function() {
                return resolve({
                    success: true,
                    host: manifestJson.host.app
                });
            });
            outputStream.on("error", function(err) {
                if(err.code === "EACCES" || err.code === "EPERM") {
                    return resolve({
                        success: false,
                        error: new Error(`Failed to package plugin for ${manifestJson.host.app} : Could not write to the target folder (no permission).`)
                    });
                }
                return resolve({
                    success: false,
                    error: err
                });
            });
            archive.pipe(outputStream);
            archive.finalize();
        });
        return prom;
    }

    package() {
        let packagePromises = [];
        const manifestJson = JSON.parse(fs.readFileSync(this.params.manifest));
        const appsList = this.params.apps;
        const manifestsJson = this.getManifestsForPackaging(manifestJson, appsList);
        for (const manifestJson of manifestsJson) {
            packagePromises.push(this.packageHost(manifestJson));
        }
        return Promise.all(packagePromises);
    }

    getFailCount(results) {
        let failCount = 0;
        for(const result of results) {
            if (!result.success) {
                UxpLogger.error(result.error.message);
                ++failCount;
            }
            else {
                UxpLogger.log(`Successfully packaged plugin for ${result.host}`);
            }
        }
        return failCount;
    }

    consolidateResult(failCount, total) {
        if(failCount === total) {
            throw "Failed to package plugin.";
        }
        else if(failCount === 0) {
            UxpLogger.log(`Package written to ${this.params.packageDir}`);
            return "Successfully packaged plugin.";
        }
        else {
            UxpLogger.log(`Package written to ${this.params.packageDir}`);
            return `Packaging succeeded for ${total - failCount} host(s), but failed for ${failCount} host(s).`;
        }
    }

    execute() {
        const prom = this.pm.validatePluginManifest(this.params);
        return prom.then(() => {
            const packageProm = this.package();
            return packageProm.then((results) => {
                const failCount = this.getFailCount(results);
                return this.consolidateResult(failCount, results.length);
            });
        }).catch((err) => {
            if(err.code === 8 || err.code === 4 || err.code === 9) {
                UxpLogger.warn(`Warning: Skipping strict manifest validation as no compatible host applications are connected to the UXP Service. Strict validation of the manifest currently requires the host application to be running.`);
                const packageProm = this.package();
                return packageProm.then((results) => {
                    const failCount = this.getFailCount(results);
                    return this.consolidateResult(failCount, results.length);
                });
            }
            throw `Packaging failed : ${err}`;
        });
    }
}

module.exports = PluginPackageCommand;
