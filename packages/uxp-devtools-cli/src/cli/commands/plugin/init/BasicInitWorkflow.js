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
const fs = require("fs");
const _ = require("lodash");
const prompts = require("prompts");
const questions = require("./BasicInitQuestions");
const semver = require("semver");
const { initWithBundledPluginTemplate } = require("./TemplateBasedInitWorkflow");

const currentPath = process.cwd();
const userInput = {};

function onCancel() {
    throw new Error("User Prompt Cancelled");
}


function onSubmit(prompt, answer) {
    const propertyName = prompt.name;
    const propertyValue = answer;

    if (!propertyValue) {
        return;
    }

    // Create Object for each host app.
    if (propertyName === "host") {
        const appList = [];
        propertyValue.forEach((element) => {
            const app = {
                app: element,
                // needs to be updated once we have more apps
                minVersion: element === "XD" ? "36.0.0" : "21.0.0",
            };
            appList.push(app);
        });
        userInput.host = appList;
        return;
    }

    // Add host app supported vesrion.
    if (propertyName.includes("version")) {
        // Check for valid Plugin Id.
        if (propertyName === "version" && semver.valid(propertyValue)) {
            userInput[propertyName] = propertyValue;
            return;
        }

        const appList = userInput.host;
        if (Array.isArray(appList) && appList.length > 0) {
            for (let i = 0; i < appList.length; i++) {
                const hostApp = appList[i];
                const appVersion = `${hostApp.app.toString().toLowerCase()}version`;
                if (propertyName === appVersion && semver.valid(propertyValue)) {
                    hostApp.minVersion = answer;
                }
            }
        }
        return;
    }

    userInput[propertyName] = propertyValue;
}


class PluginInitBasic {

    _saveManifest() {
        const filePath = path.resolve(currentPath, "manifest.json");
        fs.writeFileSync(filePath, JSON.stringify(this._data, null, 2), "utf8");
        return {
            success: true,
        };
    }

    _ensureMasterJson() {
        const manifestPath = path.join(currentPath, "manifest.json");
        if (fs.existsSync(manifestPath)) {
            // TODO(craj) -
            this._manifestJson = require(manifestPath);
            return;
        }
        this._manifestJson = {};
    }

    _getDefaultTemplate() {
        const defaultPrefix = "default-starter";
        let host = userInput.host;
        if(!Array.isArray(host)) {
            host = [ host ];
        }
        let defaultTemplate = "";
        if (host) {
            defaultTemplate = (host.length > 1) ? defaultPrefix : defaultPrefix + "-" + host[0].app.toLowerCase();
        }
        return defaultTemplate;
    }

    _executeBasicInit() {
        const manifestProm = prompts(questions, { onSubmit, onCancel });

        return manifestProm.then(() => {
            const template = this._getDefaultTemplate();
            const result = initWithBundledPluginTemplate(currentPath, template);
            if (!result.success) {
                return Promise.reject(result.error);
            }
            this._ensureMasterJson();
            this._data = _.merge(this._manifestJson, userInput);
            this._saveManifest(this._data);
            return Promise.resolve(true);
        });
    }

    execute() {
        return this._executeBasicInit();
    }

}

module.exports = PluginInitBasic;
