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

import { observable } from "mobx";
import React, { Component, Fragment } from "react";
import { observer, inject } from "mobx-react";

import More from "@spectrum-icons/workflow/More";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@react-spectrum/table";
import { StatusLight, MenuTrigger, Menu, Item, ActionButton } from "@adobe/react-spectrum";
import { PluginState } from "../../model/plugin/PluginAttrs";
import PluginLoadOptionsDialog from "./PluginLoadOptions";
import KeyboardShortcutsMgr from "../../common/KeyboardShortcutsMgr";
const KeyboardShortcutsPref = require("electron").remote.require("./KeyboardShortcutsPref");

const keyboardShortcutsMgr = KeyboardShortcutsMgr.instance();

function getVariantAndLabelFromState(pluginState) {
    let variantVal = "neutral";
    let labelVal = "None";
    switch(pluginState) {
    case PluginState.LOADED:
        variantVal = "positive";
        labelVal = "Loaded";
        break;
    case PluginState.WAITING_FOR_DEBUGGER:
        variantVal = "info";
        labelVal = "Waiting for Debugger...";
        break;
    case PluginState.DEBUGGING:
        variantVal = "negative";
        labelVal = "Debugging... ";
        break;
    case PluginState.WATCHING:
        variantVal = "info";
        labelVal = "Watching for changes...";
        break;
    case PluginState.READY:
        variantVal = "neutral";
        labelVal = "Ready";
        break;
    }
    return {
        variantVal,
        labelVal,
    };
}

const loadDetails = {
    success: "Plugin Load Successful",
    failure: "Plugin Load Failed",
    logBatch: {
        title: "Plugin Load",
    }
};

const unloadDetails = {
    success: "Plugin Unload Successful",
    failure: "Plugin Unload Failed",
    logBatch: {
        title: "Plugin Unload",
    }
};

const reloadDetails = {
    success: "Plugin Reload Successful",
    failure: "Plugin Reload Failed",
    logBatch: {
        title: "Plugin Reload",
    }
};

const debugDetails = {
    failure: "Failed to get Plugin Debug Details.",
    logBatch: {
        title: "Plugin Debug",
    }
};

const watchDetails = {
    logBatch: {
        title: "Plugin Watch",
    }
};

const unwatchDetails = {
    logBatch: {
        title: "Plugin Unwatch",
    }
};


const logDetails = {
    logBatch: {
        title: "Plugin Logs",
    }
};

const packageDetails = {
    success: "Plugin Package Successful",
    failure: "Plugin Package Failed",
    logBatch: {
        title: "Plugin Package",
    }
};

let pluginCommandDetails = {
    loadPlugin: loadDetails,
    unloadPlugin: unloadDetails,
    reloadPlugin: reloadDetails,
    debugPlugin: debugDetails,
    packagePlugin: packageDetails,
    pluginLogs: logDetails,
    watchPlugin: watchDetails,
    unWatchPlugin: unwatchDetails
};

let menuItems = [
    { name: "Load", key: "loadPlugin", loadIndependent: true },
    { name: "Unload", key: "unloadPlugin" },
    { name: "Reload", key: "reloadPlugin" },
    { name: "Watch", key: "watchPlugin" },
    { name: "Unwatch", key: "unWatchPlugin" },
    { name: "Debug", key: "debugPlugin", notDebugging: true },
    { name: "Logs", key: "pluginLogs", notDebugging: true },
    { name: "Package", key: "packagePlugin", loadIndependent: true },
    { name: "Open Folder", key: "openFolder",  loadIndependent: true },
    { name: "Options", key: "loadOptionsDialog",  loadIndependent: true }
];


class PluginSectionState {
    @observable state;
    constructor() {
        this.state = "default";
    }

    setPlugin(plugin) {
        this.plugin = plugin;
    }
}

const pluginSectionState = new PluginSectionState();

class PluginViewActionsHandler {
    loadOptionsDialog(plugin) {
        pluginSectionState.plugin = plugin;
        pluginSectionState.state = "showLoadOptions";
        return true;
    }

    debugPlugin(plugin, appViewMgr) {
        // Note: We can't have more than one CDT Window open for a given Plugin -
        // since we are using CDT Inspect for Logs use-case - we need to check if that is opened as well
        // and post appropriate info message to the user.
        if (plugin.isCDTInspectOpen) {
            const isDebuggerOpen = plugin.debuggerConnected;
            if (isDebuggerOpen) {
                appViewMgr.showToast("info", "Plugin Debug Window is already open");
            }
            else {
                appViewMgr.showToast("info", "Close the Console window to start a debug session.");
            }
            return true;
        }
        return false;
    }

    openFolder(plugin, appViewMgr) {
        appViewMgr.openFolder(plugin.pickedManifestPath);
        return true;
    }

    pluginLogs(plugin, appViewMgr) {
        // Note: We can't have more than one CDT Window open for a given Plugin -
        // since we are using CDT Inspect for Logs use-case - we need to check if that is opened as well
        // and post appropriate info message to the user.
        if (plugin.isCDTInspectOpen) {
            const isDebuggerOpen = plugin.debuggerConnected;
            if (isDebuggerOpen) {
                appViewMgr.showToast("info", "Plugin logs can be viewed in the Console tab of the Debug window.");
            }
            else {
                appViewMgr.showToast("info", "Plugin Logs Window is already open");
            }
            return true;
        }
        else if (plugin.state == PluginState.WAITING_FOR_DEBUGGER) {
            appViewMgr.showToast("info", "Plugin Logs are not available. Waiting for Debugger to resume Plugin execution");
            return true;
        }
        return false;
    }

    handleAction(actionName, plugin, appViewMgr) {
        if (this[actionName]) {
            return this[actionName].call(this, plugin, appViewMgr);
        }
        return false;
    }
}

const pluginViewActionHandler = new PluginViewActionsHandler();

@inject("appViewMgr")
@inject("appViewModel")
@observer
export default class PluginsSection extends Component {
    handlePluginActionMultiSelect(actionKey, filterBy) {
        let pluginsList = this.props.appViewModel.selectedPlugins;
        pluginsList = pluginsList.filter(filterBy);
        for(const plugin of pluginsList) {
            this.handlePluginAction(actionKey, plugin);
        }
    }

    registerPluginKeyboardShortcuts() {
        const bindingsMap = new Map();
        bindingsMap.set(KeyboardShortcutsPref.loadSelected, () => {
            this.handlePluginActionMultiSelect("loadPlugin", plugin => plugin);
        });
        bindingsMap.set(KeyboardShortcutsPref.unloadSelected, () => {
            this.handlePluginActionMultiSelect("unloadPlugin", plugin => plugin.isLoaded);
        });
        bindingsMap.set(KeyboardShortcutsPref.reloadSelected, () => {
            this.handlePluginActionMultiSelect("reloadPlugin", plugin => plugin.isLoaded);
        });
        bindingsMap.set(KeyboardShortcutsPref.reloadAll, () => {
            let pluginsList = this.props.appViewModel.pluginsList;
            pluginsList = pluginsList.filter((plugin) => plugin.isLoaded);
            for(const plugin of pluginsList) {
                this.handlePluginAction("reloadPlugin", plugin);
            }
        });
        bindingsMap.set(KeyboardShortcutsPref.watchSelected, () => {
            this.handlePluginActionMultiSelect("watchPlugin", plugin => plugin.isLoaded && !plugin.isWatched);
        });
        bindingsMap.set(KeyboardShortcutsPref.unwatchSelected, () => {
            this.handlePluginActionMultiSelect("unWatchPlugin", plugin => plugin.isWatched);
        });
        bindingsMap.set(KeyboardShortcutsPref.debugSelected, () => {
            this.handlePluginActionMultiSelect("debugPlugin", plugin => plugin.isLoaded && !plugin.isCDTInspectOpen);
        });

        keyboardShortcutsMgr.pushBindings(bindingsMap, { bind: false, replace: true });
    }

    handlePluginAction(actionkey, plugin, params) {
        const appViewMgr = this.props.appViewMgr;
        const handled = pluginViewActionHandler.handleAction(actionkey, plugin, appViewMgr);
        if (handled) {
            return;
        }

        const cmdDetails = pluginCommandDetails[actionkey];

        let batchLoggingEnbled = false;
        const appLogger =  this.props.appViewModel.appLogger;
        if (cmdDetails && cmdDetails.logBatch) {
            const details = Object.assign({}, cmdDetails.logBatch);
            details.title = `Action: ${cmdDetails.logBatch.title}`;
            details.header = plugin.id;
            appLogger.beginBatch(details);
            batchLoggingEnbled = true;
        }
        const prom = this.props.actionHandler(actionkey, plugin, params);

        if (appViewMgr && cmdDetails) {
            return prom.then((result) => {
                if (cmdDetails.success) {
                    if(actionkey !== "packagePlugin") {
                        appViewMgr.showToast("positive", cmdDetails.success);
                    }
                    else {
                        appViewMgr.showToast("positive", result, {
                            action: {
                                label: "What Now?",
                                handler: () => appViewMgr.showPluginPackageWhatNowDialog()
                            }
                        });
                    }
                }
            }).catch(() => {
                if (cmdDetails.failure) {
                    appViewMgr.showToast("negative", cmdDetails.failure, {
                        action: {
                            label: "Details",
                            handler: () => appViewMgr.showLogsDialog(),
                        }
                    });
                }
            }).then(() => {
                if (batchLoggingEnbled) {
                    appLogger.endBatch();
                }
            });
        }
        return prom;
    }

    handleSelectionChange(selection) {
        if (selection === "all") {
            this.props.onPluginsSelected(this.props.pluginsList);
        }
        else {
            const selectedPluginIds = Array.from(selection);
            const selectedPlugins = this.props.pluginsList.filter((plugin) => selectedPluginIds.includes("" + plugin.modelId));
            this.props.onPluginsSelected(selectedPlugins);
        }

    }

    handleLoadOptionsCommit(...args) {
        pluginSectionState.state = "default";
        this.handlePluginAction(...args);
    }

    handleLoadOptionsCancelled() {
        pluginSectionState.state = "default";
    }

    componentDidMount() {
        this.registerPluginKeyboardShortcuts();
    }

    render() {
        // using UNSAFE_style's marginBottom of 80px - for uxp-15455 = Spectrum table view might not be handling the sizing correctly.
        // 80px is two cells height.
        return <div style={{ height:"80vh", overflow:"scroll" }}>
            <Fragment>
                <Table UNSAFE_style={{ marginBottom: "80px" }} aria-label="Table" selectionMode="multiple" sortDescriptor={{ column: "plugin", direction: "descending" }}
                    onSelectionChange={(selection) => this.handleSelectionChange(selection)}>
                    <TableHeader>
                        <Column width={75} key="app">App</Column>
                        <Column key="id">ID</Column>
                        <Column key="plugin">Plugin</Column>
                        <Column key="state">State</Column>
                        <Column align="end" width={75}  key="action">Actions</Column>
                    </TableHeader>
                    <TableBody>
                        {
                            this.props.pluginsList.map(plugin => {
                                const watchFilter = plugin.isWatched ? "watchPlugin" : "unWatchPlugin";
                                let updatedMenuItems = menuItems.filter((menu) =>
                                    menu.key !== watchFilter);

                                const isPluginLoaded = plugin.isLoaded;
                                const disabledMenuItems = updatedMenuItems.filter((menu) => {
                                    if (menu.loadIndependent) {
                                        return false;
                                    }
                                    return !isPluginLoaded;
                                });

                                const disabledMenuKeys = disabledMenuItems.map((menu) => menu.key);
                                const stateDetails = getVariantAndLabelFromState(plugin.state);
                                return (<Row key={plugin.modelId}>
                                    <Cell>{plugin.pluginHost.app}</Cell>
                                    <Cell>{plugin.id}</Cell>
                                    <Cell>{plugin.name}</Cell>
                                    <Cell>
                                        <StatusLight UNSAFE_className="pluginCardStateCell" variant={stateDetails.variantVal}>
                                            {stateDetails.labelVal}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>
                                        <MenuTrigger>
                                            <ActionButton isQuiet><More/></ActionButton>
                                            <Menu onAction={(key) => this.handlePluginAction(key, plugin)} options={updatedMenuItems}
                                                disabledKeys={disabledMenuKeys}>
                                                {
                                                    updatedMenuItems.map((item) => {
                                                        return (<Item key={item.key}>{item.name}</Item>);
                                                    })
                                                }
                                            </Menu>
                                        </MenuTrigger>
                                    </Cell>
                                </Row>);
                            })
                        }
                    </TableBody>
                </Table>
                {(pluginSectionState.state == "showLoadOptions"
                    ? <PluginLoadOptionsDialog plugin={pluginSectionState.plugin} close={this.handleLoadOptionsCancelled.bind(this)} commitHandler={this.handleLoadOptionsCommit.bind(this)} />
                    : null)}
            </Fragment></div>;
    }
}
