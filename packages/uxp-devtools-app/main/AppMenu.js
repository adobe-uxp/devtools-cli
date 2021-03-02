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

const { app, Menu } = require("electron");
const { shell } = require("electron");
const KeyboardShortcutsPref = require("./KeyboardShortcutsPref");

function openHelpPage() {
    shell.openExternal("https://www.adobe.com/go/uxp-developer-tool-support");
}

class MenuBuilder {

    constructor(mainWindow, isDevEnv = false) {
        this.mainWindow = mainWindow;
        this.isDevEnv = isDevEnv;
    }

    buildMenu() {
        if (this.isDevEnv) {
            // this.setupDevelopmentEnvironment();
        }

        const template
        = process.platform === "darwin"
            ? this.buildDarwinTemplate()
            : this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupDevelopmentEnvironment() {
        this.mainWindow.webContents.on("context-menu", (_, props) => {
            const { x, y } = props;

            Menu.buildFromTemplate([
                {
                    label: "Inspect element",
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y);
                    },
                },
            ]).popup({ window: this.mainWindow });
        });
    }

    dispatchKeypressToRenderer(item, focusedWindow) {
        focusedWindow?.webContents?.send("keyboard-shortcut", item.accelerator);
    }

    getSubMenuActions() {
        const {
            loadSelected,
            unloadSelected,
            reloadSelected,
            reloadAll,
            watchSelected,
            unwatchSelected,
            debugSelected
        } = KeyboardShortcutsPref;
        const subMenuActions = {
            label: "Actions",
            submenu: [
                {
                    label: "Load Selected",
                    accelerator: loadSelected,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Unload Selected",
                    accelerator: unloadSelected,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Reload Selected",
                    accelerator: reloadSelected,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Reload All",
                    accelerator: reloadAll,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Watch Selected",
                    accelerator: watchSelected,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Unwatch Selected",
                    accelerator: unwatchSelected,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Debug Selected",
                    accelerator: debugSelected,
                    click: this.dispatchKeypressToRenderer
                }
            ]
        };
        return subMenuActions;
    }

    buildDarwinTemplate() {
        const {
            createPlugin,
            addPlugin,
            removeSelectedPlugins,
        } = KeyboardShortcutsPref;
        const appName = app.getName();
        const subMenuAbout = {
            label: appName,
            submenu: [
                {
                    label: "About UXP Developer Tool",
                    selector: "orderFrontStandardAboutPanel:",
                },
                { type: "separator" },
                { label: "Services", role: "services" },
                { type: "separator" },
                {
                    label: "Hide " + appName,
                    accelerator: "Command+H",
                    selector: "hide:",
                },
                {
                    label: "Hide Others",
                    accelerator: "Command+Shift+H",
                    selector: "hideOtherApplications:",
                },
                { label: "Show All", selector: "unhideAllApplications:" },
                { type: "separator" },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: () => {
                        app.quit();
                    },
                },
            ],
        };

        const subMenuFile = {
            label: "File",
            submenu: [
                {
                    label: "Create Plugin...",
                    accelerator: createPlugin,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Add Plugin...",
                    accelerator: addPlugin,
                    click: this.dispatchKeypressToRenderer
                },
                {
                    label: "Remove Selected Plugins",
                    accelerator: removeSelectedPlugins,
                    click: this.dispatchKeypressToRenderer
                }
            ]
        };

        const subMenuEdit = {
            label: "Edit",
            submenu: [
                { label: "Cut", accelerator: "Command+X", selector: "cut:" },
                { label: "Copy", accelerator: "Command+C", selector: "copy:" },
                { label: "Paste", accelerator: "Command+V", selector: "paste:" }
            ],
        };

        const subMenuActions = this.getSubMenuActions();

        const subMenuViewDev = {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    accelerator: "Command+R",
                    click: () => {
                        this.mainWindow.webContents.reload();
                    },
                },
                {
                    label: "Toggle Full Screen",
                    accelerator: "Ctrl+Command+F",
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: "Alt+Command+I",
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    },
                },
            ],
        };
        const subMenuViewProd = {
            label: "View",
            submenu: [
                {
                    label: "Toggle Full Screen",
                    accelerator: "Ctrl+Command+F",
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
            ],
        };
        const subMenuWindow = {
            label: "Window",
            submenu: [
                {
                    label: "Minimize",
                    accelerator: "Command+M",
                    selector: "performMiniaturize:",
                },
                { label: "Close", accelerator: "Command+W", selector: "performClose:" },
                { type: "separator" },
                { label: "Bring All to Front", selector: "arrangeInFront:" },
            ],
        };
        const subMenuHelp = {
            label: "Help",
            submenu: [
                {
                    label: "UXP Developer Tool Help",
                    click: () => {
                        openHelpPage();
                    }
                }
            ]
        };

        const subMenuView = this.isDevEnv
            ? subMenuViewDev
            : subMenuViewProd;

        return [
            subMenuAbout,
            subMenuFile,
            subMenuEdit,
            subMenuActions,
            subMenuView,
            subMenuWindow,
            subMenuHelp
        ];
    }

    buildDefaultTemplate() {
        const {
            createPlugin,
            addPlugin,
            removeSelectedPlugins,
        } = KeyboardShortcutsPref;
        const subMenuActions = this.getSubMenuActions();
        const templateDefault = [
            {
                label: "&File",
                submenu: [
                    {
                        label: "Create Plugin...",
                        accelerator: createPlugin,
                        click: this.dispatchKeypressToRenderer
                    },
                    {
                        label: "Add Plugin...",
                        accelerator: addPlugin,
                        click: this.dispatchKeypressToRenderer
                    },
                    {
                        label: "Remove Selected Plugins",
                        accelerator: removeSelectedPlugins,
                        click: this.dispatchKeypressToRenderer
                    },
                    {
                        label: "&Close",
                        accelerator: "Ctrl+W",
                        click: () => {
                            this.mainWindow.close();
                        }
                    }
                ]
            },
            {
                label: "Edit",
                submenu: [
                    { role: "cut" },
                    { role: "copy" },
                    { role: "paste" } ]
            },
            subMenuActions,
            {
                label: "&View",
                submenu:
            this.isDevEnv
                ? [
                    {
                        label: "&Reload",
                        accelerator: "Ctrl+R",
                        click: () => {
                            this.mainWindow.webContents.reload();
                        },
                    },
                    {
                        label: "Toggle &Full Screen",
                        accelerator: "F11",
                        click: () => {
                            this.mainWindow.setFullScreen(
                                !this.mainWindow.isFullScreen()
                            );
                        },
                    },
                    {
                        label: "Toggle &Developer Tools",
                        accelerator: "Alt+Ctrl+I",
                        click: () => {
                            this.mainWindow.webContents.toggleDevTools();
                        },
                    },
                ]
                : [
                    {
                        label: "Toggle &Full Screen",
                        accelerator: "F11",
                        click: () => {
                            this.mainWindow.setFullScreen(
                                !this.mainWindow.isFullScreen()
                            );
                        },
                    },
                ],
            },
            {
                label: "Help",
                submenu: [
                    {
                        label: "About UXP Developer Tool",
                        click: () => {
                            app.setAboutPanelOptions({
                                copyright: "Copyright © 2020 Adobe Inc",
                            });
                            app.showAboutPanel();
                        }
                    },
                    {
                        label: "UXP Developer Tool Help",
                        click: () => {
                            openHelpPage();
                        }
                    }
                ]
            },
        ];

        return templateDefault;
    }
}

module.exports = MenuBuilder;
