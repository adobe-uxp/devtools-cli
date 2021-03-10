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

import path from "path";
import fs from "fs-extra";
import { getDevtoolsAppDataFolder } from "../model/common/AppHelpers";

import { observable, action } from "mobx";

function getAppSettingsPrefsPath() {
    const devToolsAppFolder = getDevtoolsAppDataFolder();
    return path.resolve(devToolsAppFolder, "app_prefs.json");
}

const kServicePort = 14001;

const kValidThemeValues = [
    "auto",
    "light",
    "dark"
];

export default class AppSettingsPrefs {
    @observable theme;
    @observable port;

    constructor() {
        this.theme = "light";
        this.port = kServicePort;
    }

    static createFromSaved() {
        const prefsPath = getAppSettingsPrefsPath();
        let data = {};
        try {
            const contents = fs.readFileSync(prefsPath, "utf-8");
            data = JSON.parse(contents.toString());
        }
        catch (err) {
            // silently eat up the error - the preference file might not be present -
            // for eg: when using for first time
        }
        const appSettings = new AppSettingsPrefs();
        if (data.theme) {
            // sanity check
            const isValid = (typeof data.theme === "string") && kValidThemeValues.includes(data.theme);
            if (isValid) {
                appSettings.theme = data.theme;
            }
        }

        if (data.port) {
            appSettings.port = data.port;
        }

        return appSettings;
    }

    saveCurrentSettings() {
        const data = {
            theme: this.theme,
            port: this.port
        };

        const prefsPath = getAppSettingsPrefsPath();
        const contents = JSON.stringify(data);
        fs.writeFileSync(prefsPath, contents, "utf8");
    }

    @action
    setServicePort(port) {
        this.port = port;
    }

    @action
    setAppTheme(theme) {
        this.theme = theme;
    }

}
