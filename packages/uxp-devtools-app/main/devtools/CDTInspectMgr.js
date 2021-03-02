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

const { getCompleteInspectorUrlWithTitle } = require("./CDTCommonUtils");

const { BrowserWindow } = require("electron");

class CDTInspectMgr {

    setAppClosed() {
        this._mainWindowClosed = true;
    }

    openChromDevtoolsInspector(mainWindow, cdtDebugWsUrl, details, clientData) {
        const mainBounds = mainWindow.getBounds();
        const cdtWindowOptions = {
            webPreferences: { webSecurity: false },
            width: Math.floor(mainBounds.width * 0.75),
            height: Math.floor(mainBounds.height * 0.75),
        };

        const childWindow = new BrowserWindow(cdtWindowOptions);

        const uxpDevtoolsUrl = getCompleteInspectorUrlWithTitle(cdtDebugWsUrl, details);
        childWindow.loadURL(uxpDevtoolsUrl);
        childWindow.on("closed", () => {
            if (this._mainWindowClosed) {
                return;
            }
            mainWindow.webContents.send("cdt-inspect-window-closed", clientData);
        });

        // childWindow.openDevTools();

        mainWindow.webContents.send("cdt-inspect-window-opened", clientData);
    }
}

module.exports = new CDTInspectMgr();
