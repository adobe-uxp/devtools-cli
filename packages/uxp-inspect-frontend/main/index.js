/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { app, BrowserWindow, screen, powerMonitor } = require("electron");
const path = require("path");

const { getCompleteInspectorUrlWithTitle } = require("./devtools/CDTCommonUtils");


let mainWindow;

const args = process.argv;
let isLaunchedForCLIInspectWorkflow = args.length > 2;

function getMainAppUrlPath() {
    let appHtmlPath = path.resolve(__dirname, "..", "src", "index.html");
    return `file://${appHtmlPath}`;
}

function getCLIInspectWorkflowUrl() {
    const argv = require("minimist")(process.argv.slice(2));

    const cdtDebugWsUrl = argv.cdtDebugWsUrl;
    const detailsStr = argv.details;
    if (!cdtDebugWsUrl || !detailsStr) {
        return null;
    }
    // let parse throw exception if this is not a valid json.
    const inspectDetails = JSON.parse(detailsStr);
    const loadUrlPath = getCompleteInspectorUrlWithTitle(cdtDebugWsUrl, inspectDetails);
    return loadUrlPath;
}

function createWindow() {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const minWidth = Math.floor(width * 0.35);
    const minHeight = Math.floor(height * 0.5);

    const windowOptions = {
        width: Math.floor(width * 0.7),
        height: Math.floor(height * 0.75),
        title: `Adobe UXP Developer Tool`,
        minWidth,
        minHeight,
        webPreferences: {
            enableRemoteModule: true,
            webSecurity: false,
            nodeIntegration: true,
        },
    };

    const isMainAppAndProd = !isLaunchedForCLIInspectWorkflow;

    if (isMainAppAndProd) {
        // when devtools is open we can't drag the window around - so ot fix that bug.
        windowOptions.titleBarStyle = "hiddenInset";
    }

    mainWindow = new BrowserWindow(windowOptions);

    let loadUrlPath = getMainAppUrlPath();

    if (isLaunchedForCLIInspectWorkflow) {
        // if this launched from cli - then the app might be used for launching CDT Inspect window directly -
        // so, cater to that workflow.
        loadUrlPath = getCLIInspectWorkflowUrl(args);
    }

    // console.log(`app Html path is ${appHtmlPath}`);
    mainWindow.loadURL(loadUrlPath);

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.allowRendererProcessReuse = true;
app.on("ready", () => {
    createWindow();

    powerMonitor.on("resume", () => {
        UxpAppLogger.log("Main App Resume called");
        if (mainWindow) {
            mainWindow.webContents.send("appResumed");
        }
    });
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

const isMainDevtoolsApp = !isLaunchedForCLIInspectWorkflow;

// prevent multiple instance of the Main Devtools app from running. - uxp-15281
if (isMainDevtoolsApp) {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    }
    else {
        app.on("second-instance", () => {
        // Someone tried to run a second instance, we should focus our window.
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }
        });
    }
}

