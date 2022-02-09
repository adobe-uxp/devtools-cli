/* eslint-disable global-require */
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
const fs = require("fs");
const { exec } = require("child_process");
const { FeatureFlag } = require("@adobe/uxp-devtools-feature");

const isInternalBuild = FeatureFlag.isFeatureEnabled("internalPluginWorkspace");

function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}


// NOTE - the mac and win scripts in the devtools folder contains these folder information
// as well - its kind of duplicated for now - so, if you update here - make sure to update the
// directory paths in those scripts file as well - else enable/disable commadns wouldn't work correctly.
// Initially, we used to use node scripts to execute the enable /disable command but then
// but these script be run from other envirments as well - for eg: from within Electron app - so,
// Node is not accessible directly there and so we need to rely on basic low-level batch scripts to
// peform these tasks
function getUxpDeveloperConfigFilePath() {
    let baseFolder = "";
    if (process.platform === "win32") {
        baseFolder = process.env.CommonProgramFiles;
    }
    else {
        baseFolder = `/Library/Application Support`;
    }
    baseFolder = path.join(baseFolder, "/Adobe/UXP/");
    const relativePath = "Developer";
    return {
        baseFolder,
        relativePath,
        configFile: "settings.json"
    };
}


// When running in environments like inside Electron app -
// the scripts can't be run as-is  - for now, we are copying the scripts to a folder
// which is passed as option by caller and execute those scripts - inside of the inline ones -
function setupScriptsForExecution(scriptsFolder, isMac) {
    let scriptName =  isInternalBuild ? "internal_" : "";
    scriptName = isMac ? scriptName + "mac.sh" : scriptName + "win32.bat";
    const macScriptPath = path.resolve(__dirname, "devtools", scriptName);

    const scriptDestPath = path.resolve(scriptsFolder, scriptName);
    fs.copyFileSync(macScriptPath, scriptDestPath);
}

function getWinScript(enable, scriptsFolder) {
    let scriptName = isInternalBuild ? "internal_win32.bat" : "win32.bat";
    const batchScriptFilePath = path.resolve(scriptsFolder, scriptName);
    const winScript = `powershell.exe -command "Start-Process -FilePath '${batchScriptFilePath}' -ArgumentList '${enable}' -Verb runas -Wait"`;
    return winScript;
}

function getMacScript(enable) {
    let scriptName = isInternalBuild ? "internal_mac.sh" : "mac.sh";
    const uxpScript = `sh ${scriptName} ${enable}`;
    const wrapUxpScript = `"${uxpScript}"`;

    const osaScript = `osascript -e 'do shell script ${wrapUxpScript} with administrator privileges'`;
    return osaScript;
}

function runCommandInAdminModeCommon(enable, options) {
    let scriptsFolder = path.resolve(__dirname, "devtools");
    const isMac = process.platform == "darwin";
    const isControllerMode = options && options.controlled;
    if (isControllerMode) {
        scriptsFolder = options.scriptsFolder;
        setupScriptsForExecution(scriptsFolder, isMac);
    }
    const scriptCmd = isMac ? getMacScript(enable) : getWinScript(enable, scriptsFolder);
    const deferred = createDeferredPromise();
    exec(scriptCmd,
        {
            cwd: scriptsFolder
        },
        (error, stdout, stderr) => {
            if (error !== null) {
                UxpLogger.log(`Devtools command Failed with error: ${error}`);
                deferred.reject(error);
                return;
            }
            UxpLogger.verbose(stdout);
            UxpLogger.verbose(stderr);
            deferred.resolve(true);
        });
    return deferred.promise;
}

function devToolsCommandRunner(enable, options) {
    return runCommandInAdminModeCommon(enable, options);
}

function getUxpDeveloperConfigFullPath() {
    const configParams = getUxpDeveloperConfigFilePath();
    const configFileFullPath = path.join(configParams.baseFolder, configParams.relativePath, configParams.configFile);
    return configFileFullPath;
}

function isUxpDevToolsEnabled() {
    const configFilePath = getUxpDeveloperConfigFullPath();
    try {
        if (fs.existsSync(configFilePath)) {
            const contents = fs.readFileSync(configFilePath, "utf8");
            const config = JSON.parse(contents);

            return !isInternalBuild ? config.developer === true : (config.developer === true) && (config.hostAppPluginWorkspace === true);
        }
    // eslint-disable-next-line no-empty
    }
    catch (err) {
        console.log(`Error is ${err}`);
    }
    return false;
}

function isDevToolsEnabled() {
    return Promise.resolve(isUxpDevToolsEnabled());
}

module.exports = {
    devToolsCommandRunner,
    isDevToolsEnabled,
};
