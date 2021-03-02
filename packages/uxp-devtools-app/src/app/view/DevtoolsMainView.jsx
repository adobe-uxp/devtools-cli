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

import { observer, inject } from "mobx-react";
import React, { Component } from "react";

import { Flex, View, Button, Text, ButtonGroup } from "@adobe/react-spectrum";
import PluginsSection from "./components/PluginsSection";
import EmptyPluginWorkspace from "./components/EmptyPluginWorkspace";
import EnableDevtoolsDialog from "./components/EnableDevtoolsDialog";
import AppModalDialogMgr from "./components/AppModalDialogMgr";
import KeyboardShortcutsMgr from "../common/KeyboardShortcutsMgr";
const KeyboardShortcutsPref = require("electron").remote.require("./KeyboardShortcutsPref");

import "./styles.css";

const keyboardShortcutsMgr = KeyboardShortcutsMgr.instance();

@observer
class AppDetails extends Component {
    render() {
        const app = this.props.app;
        return (
            <Flex direction="row" height="size-600">
                <div className="appDetailsCard">
                    <img src={this.props.appViewMgr.getIconForApp(app.appId)}></img>
                    {/* This is a temporary fix for https://jira.corp.adobe.com/browse/XD-125171
                    @ToDo (apsharma) Remove this change once the issue is fixed in XD 37. */}
                    <Text>{app.appName == "XD" ? " Adobe XD" : app.appName}</Text>
                    <Text>{app.appVersion}</Text>
                </div>
            </Flex>
        );
    }
}

function logErrorDetails(err) {
    if (err.message) {
        UxpAppLogger.error(err.message);
    }
    if (err.details) {
        let msg = err.details;
        if (err.details.message) {
            msg = err.details.message;
        }
        if (msg) {
            UxpAppLogger.error(msg, err);
        }
    }
}



@inject("appViewMgr")
@inject("appViewModel")
@observer
export default class DevtoolsMain extends Component {
    registerKeyboardShortcuts() {
        const bindingsMap = new Map();
        bindingsMap.set(KeyboardShortcutsPref.createPlugin, this.createPluginHandler.bind(this));
        bindingsMap.set(KeyboardShortcutsPref.addPlugin, this.handleAddPlugin.bind(this));
        bindingsMap.set(KeyboardShortcutsPref.removeSelectedPlugins, this.handleRemoveSelectedPlugins.bind(this));
        keyboardShortcutsMgr.pushBindings(bindingsMap, { bind: false, replace: true });
        AppModalDialogMgr.on("dialog-opened", () => {
            keyboardShortcutsMgr.disable();
        });
        AppModalDialogMgr.on("dialog-closed", () => {
            keyboardShortcutsMgr.enable();
        });
    }


    _wrapActionProm(actionProm) {
        return actionProm.catch((err) => {
            logErrorDetails(err);
            throw err;
        });
    }

    handleAddPlugin() {
        const appLogger =  this.props.appViewModel.appLogger;
        const appViewMgr = this.props.appViewMgr;
        appLogger.beginBatch({
            title: "Action: Add Plugin"
        });

        const prom = this.props.appViewModel.performAppAction("addPlugin");
        const actionProm = this._wrapActionProm(prom);
        actionProm.catch((details) => {
            // Error Codes as present in AddPluginCommand.js class ErrorCode
            if (details.code == 1) {
                const msg = "Plugin with same Id is already present in the Workspace.";
                this.props.appViewMgr.showToast("negative", msg, {
                    action: {
                        label: "Details",
                        handler: () => appViewMgr.showLogsDialog()
                    }
                });
            }
            else {
                const msg = "Failed to Add Plugin to Workspace";
                this.props.appViewMgr.showToast("negative", msg, {
                    action: {
                        label: "Details",
                        handler: () => appViewMgr.showLogsDialog(),
                    }
                });
            }
        }).then(() => {
            appLogger.endBatch();
        });
    }

    handlePluginsSelected(selectedList) {
        this.props.appViewModel.setSelectedPlugins(selectedList);
    }

    handleRemoveSelectedPlugins() {
        const selectedPlugins = this.props.appViewModel.selectedPlugins;
        if (!selectedPlugins.length) {
            return;
        }

        const proms = [];
        for (const plugin of selectedPlugins) {
            const prom = this.props.appViewModel.performAppAction("removePlugin", plugin);
            proms.push(this._wrapActionProm(prom));
        }
        Promise.all(proms).then(() => {
            // TODO(craj) - need to check how to handle selection state - calling empty here might not be the best way.
            this.handlePluginsSelected([]);
        });
    }

    pluginActionHandler(action, plugin, params) {
        const prom = this.props.appViewModel.performPluginAction(plugin, action, params);
        return this._wrapActionProm(prom);
    }

    createPluginHandler() {
        this.props.appViewMgr.showCreatePluginDialog();
    }

    componentDidMount() {
        this.registerKeyboardShortcuts();
    }

    componentWillUnmount() {
        AppModalDialogMgr.removeAllListeners();
        keyboardShortcutsMgr.reset();
    }

    render() {
        const appViewModel = this.props.appViewModel;
        const connectedApps = appViewModel.connectedApps;

        const isPluginsAvailable =  appViewModel.pluginsList && appViewModel.pluginsList.length > 0;
        const isDevtoolsDisabled = !appViewModel.devToolsEnabled;
        return (
            <div className="startViewContainer" id="uxpDevtoolsMainContainerId">
                <div className="flexBasedFullContainer rowBasedFlexContainer">
                    <div className="leftNavBarContainer">
                        <Flex direction="column" gap="size-200" marginTop="size-200">
                            <h3 className="sideNavHeader">CONNECTED APPLICATIONS</h3>
                            <Flex direction="column" gap="size-100">
                                {
                                    connectedApps.map((app, index) =>  (<AppDetails app={app} key={index} appViewMgr={this.props.appViewMgr} />))
                                }
                            </Flex>
                        </Flex>
                    </div>
                    {/* Adding unsafe style for resizing fix UXP-16267 */}
                    <Flex direction="column" flexGrow="1"  UNSAFE_style={{ overflowX: "scroll" }} >
                        <View flexGrow="1" backgroundColor="gray-100">
                            {
                                (isPluginsAvailable
                                    ? (<Flex direction="column">
                                        <Flex direction="row" alignSelf="flex-end" margin="size-125" >
                                            <ButtonGroup>
                                                {
                                                    this.props.appViewModel.selectedPlugins.length > 0
                                                        ? <Button variant="primary" onPress={this.handleRemoveSelectedPlugins.bind(this)}>Remove Selected</Button>
                                                        : null
                                                }
                                                <Button variant="primary" onPress={this.createPluginHandler.bind(this)}>Create Plugin...</Button>
                                                <Button variant="cta" onPress={this.handleAddPlugin.bind(this)}>Add Plugin...</Button>
                                            </ButtonGroup>
                                        </Flex>
                                        <PluginsSection pluginsList={appViewModel.pluginsList} onPluginsSelected={this.handlePluginsSelected.bind(this)}
                                            actionHandler={this.pluginActionHandler.bind(this)} />
                                    </Flex>)
                                    : <EmptyPluginWorkspace  handleAddPluginClicked={this.handleAddPlugin.bind(this)} />)
                            }
                        </View>
                    </Flex>
                </div>
                {
                    isDevtoolsDisabled ?  <EnableDevtoolsDialog /> : null
                }
                {
                    AppModalDialogMgr.dialog
                }
            </div>
        );
    }
}

