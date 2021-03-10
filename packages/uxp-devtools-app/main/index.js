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

const { app, BrowserWindow, screen, powerMonitor } = require("electron");
const path = require("path");

const { ipcMain } = require("electron");
const DevtoolsServiceMgr = require("./devtools/DevtoolsServiceMgr");
const CDTInspectMgr = require("./devtools/CDTInspectMgr");
const DevtoolsLogMgr = require("./devtools/DevtoolsLogMgr");
const MenuBuilder = require("./AppMenu");
const { getCompleteInspectorUrlWithTitle } = require("./devtools/CDTCommonUtils");
const { CoreHelpers } = require("@adobe/uxp-devtools-core");

let mainWindow;
const isDevEnvironment = false;

const args = process.argv;
const isLaunchedForCLIInspectWorkflow = args.length > 2;

function getMainAppUrlPath() {
    let appHtmlPath = path.resolve(__dirname, "..", "dist", "index.html");
    return `file://${appHtmlPath}`;
}

function getCLIInspectWorkflowUrl() {
    const argv = require("minimist")(process.argv.slice(2));
    console.log("Passed args are " + JSON.stringify(argv));

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
            webSecurity: false,
            nodeIntegration: true,
        },
    };

    const isMainAppAndProd = !isDevEnvironment && !isLaunchedForCLIInspectWorkflow;

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
        CDTInspectMgr.setAppClosed();
        app.quit();
    });

    const menuBuilder = new MenuBuilder(mainWindow, isDevEnvironment);
    menuBuilder.buildMenu();
}

app.allowRendererProcessReuse = true;
app.on("ready", () => {
    createWindow();
    /* craj - commenting this event as it is not used yet - keeping this for future reference.
    powerMonitor.on('suspend', () => {
        DevtoolsLogMgr.logMainEvent("log", "Main App Suspend called");
        if (mainWindow) {
            mainWindow.webContents.send("appSuspended")
        }
    });
    */

    powerMonitor.on("resume", () => {
        DevtoolsLogMgr.logMainEvent("log", "Main App Resume called");
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

app.on("will-quit", () => {
    const serviceInstance = DevtoolsServiceMgr.instance();
    serviceInstance.handleAppQuit();
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


// / Devtools IPC Messages

function registerDevtoolsIPCMessages() {
    ipcMain.handle("start-service", async(event, port) => {
        const serviceInstance = DevtoolsServiceMgr.instance();
        const result = await serviceInstance.startService(port);
        return result;
    });

    ipcMain.handle("check-service-port", async(event, port) => {
        const serviceInstance = DevtoolsServiceMgr.instance();
        const result = await serviceInstance.checkServicePort(port);
        return result;
    });

    ipcMain.handle("launch-chrome-devtools-inspector", async(event, cdtDebugWsUrl, pluginDetails, clientData) => {
        try {
            CDTInspectMgr.openChromDevtoolsInspector(mainWindow, cdtDebugWsUrl, pluginDetails, clientData);
            return Promise.resolve(true);
        }
        catch(err) {
            return Promise.reject(err);
        }
    });

    ipcMain.handle("is-devtools-enabled", async() => {
        const serviceInstance = DevtoolsServiceMgr.instance();
        const result = await serviceInstance.isDevToolsEnabled();
        return result;
    });

    ipcMain.handle("enable-devtools", async() => {
        const serviceInstance = DevtoolsServiceMgr.instance();
        return await serviceInstance.enableDevTools();
    });

    ipcMain.handle("disable-devtools", async() => {
        const serviceInstance = DevtoolsServiceMgr.instance();
        return await serviceInstance.disableDevTools();
    });

    ipcMain.handle("watch-plugin", async(event, pluginManifestPath, clientData) => {
        const watchServiceInstance = CoreHelpers.WatchServiceMgr.instance();
        const pluginPath = path.dirname(pluginManifestPath);
        const { pluginModelId } = clientData;
        return await watchServiceInstance.watchPlugin(pluginPath, () => {
            event.sender.send("plugin-contents-change", clientData);
        }, pluginModelId);
    });

    ipcMain.handle("unwatch-plugin", async(event, pluginManifestPath, clientData) => {
        const watchServiceInstance = CoreHelpers.WatchServiceMgr.instance();
        const pluginPath = path.dirname(pluginManifestPath);
        const { pluginModelId } = clientData;
        return await watchServiceInstance.stopPluginWatch(pluginPath, pluginModelId);
    });

    ipcMain.handle("app-log-event", (event, details) => {
        DevtoolsLogMgr.logAppEvent(details.type, details.message, details.args);
    });
}

registerDevtoolsIPCMessages();
