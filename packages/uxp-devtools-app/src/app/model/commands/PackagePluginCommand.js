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

import BaseCommand from "./BaseCommand";
const { remote } = require("electron");

async function showFolderPickerDialog() {
    const dialog = remote.dialog;
    const message = "Select target directory for plugin package";
    const title = message;
    const options = { message, title , properties:[ "openDirectory", "createDirectory" ] };

    /*
    For unit test we are not launching app and directly invoking the package command
    so remote object will not have getCurrentWindow method in this case
    */

    if(!Object.prototype.hasOwnProperty.call(remote, "getCurrentWindow")) {
        return "./";
    }

    const window = remote.getCurrentWindow();
    const result = await dialog.showOpenDialog(window,options);
    if (result && !result.canceled && Array.isArray(result.filePaths)) {
        return result.filePaths[0];
    }
    return undefined;
}

const ErrorCode = {
    ALREADY_ADDED: 1,
    DIALOG_CANCELLED: 2
};

export default class PackagePluginCommand extends BaseCommand {
    async execute() {
        const packageDir = await showFolderPickerDialog();
        if (!packageDir) {
            return Promise.reject(ErrorCode.DIALOG_CANCELLED);
        }
        const plugin = this.params.plugin;
        const packageParams = {
            manifest : plugin.manifestPath,
            packageDir,
            apps: [ plugin.pluginHost.app ]
        };
        const commandProm = this.clientMgr.packagePlugin(packageParams);
        return commandProm.then((res) => {
            return res;
        }).catch((err) => {
            const error = this.createError(null, err);
            throw error;
        });
    }
}
