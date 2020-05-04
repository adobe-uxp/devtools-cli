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

const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const url = require('url');
const process = require('process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const args = process.argv.slice(1);
const extId = args[0];
const appName = args[1];
const appVersion = args[2];
const cdtWSDebugUrl = args[3];


function createWindow() {
    // Create the browser window.
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: Math.floor(width * 0.75),
        height: Math.floor(height * 0.8),
        title: `${extId}  ${appName}@${appVersion}`,
        webPreferences: { webSecurity: false },
    });

    // and load the index.html of the app.
    const chromeDevToolsFrontEnd = path.join(__dirname, '../../node_modules', "chrome-devtools-frontend");
    const inspectorPage = path.join(chromeDevToolsFrontEnd, "front_end/devtools_app.html");

    let inspectorUrl = url.pathToFileURL(inspectorPage);
    inspectorUrl += `?${cdtWSDebugUrl}`;
    mainWindow.loadURL(inspectorUrl);

    // Note: Open devTools for any debugging
    // mainWindow.openDevTools();

    mainWindow.on("page-title-updated", (event) => {
        event.preventDefault();
    });
    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });
}

app.allowRendererProcessReuse = true;

app.on('ready', createWindow);

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
});
