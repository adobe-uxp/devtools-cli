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

import electron from "electron";
import AppSettingsPrefs from "./AppSettingsPrefs";
import BannerManager from "../view/components/banner/BannerManager";
import AppIconMgr from "../common/AppIconsMgr";
import ApplicationLogsView from "../view/components/ApplicationLogsView";
import PluginInfoView from "../view/components/PluginInfoView";
import AppModalDialogMgr from "../view/components/AppModalDialogMgr";
import CreatePluginDialog from "../view/components/CreatePluginDialog";
import PluginPackageWhatNowDialog from "../view/components/PluginPackageWhatNowDialog";


export default class AppViewMgr {
    constructor() {
        this._appSettingsPrefs = AppSettingsPrefs.createFromSaved();
    }

    showToast(variant, message, options = null) {
        /*
         NOTE NOTE: the BannerToast is a tentative solution till we have the standard spectrum v3 Toast component.
         BannerContainer's createToastNode method uses - the document.getElementById("uxpDevtoolsMainContainerId");
         which is kind of HACK ( direct info access to the Id of the main container - which should be avoided)
         */
        const toastProps = {
            variant,
            message
        };

        if (options && options.action) {
            toastProps.actionLabel  = options.action.label;
            toastProps.OnAction = options.action.handler;
        }
        BannerManager.openToast("message", toastProps);
    }

    get appUIPrefs() {
        return this._appSettingsPrefs;
    }

    quitApp() {
        const currWindow = electron.remote.getCurrentWindow();
        currWindow.close();
    }

    saveUIPreferences() {
        this._appSettingsPrefs.saveCurrentSettings();
    }

    getIconForApp(appId) {
        return AppIconMgr.getIconForApp(appId);
    }

    showLogsDialog() {
        AppModalDialogMgr.showModalDialog(ApplicationLogsView);
    }

    showInfoDialog() {
        AppModalDialogMgr.showModalDialog(PluginInfoView);
    }

    showCreatePluginDialog() {
        AppModalDialogMgr.showModalDialog(CreatePluginDialog);
    }

    showPluginPackageWhatNowDialog() {
        AppModalDialogMgr.showModalDialog(PluginPackageWhatNowDialog);
    }

    openFolder(itemPath) {
        try {
            electron.shell.showItemInFolder(itemPath);
        }
        catch (err) {
            UxpAppLogger.error(`Failed to open folder for path ${itemPath}`);
        }
    }
}
