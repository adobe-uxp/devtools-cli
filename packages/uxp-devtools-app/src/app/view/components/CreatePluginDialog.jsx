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

import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { Dialog, Heading , Content, Form, Divider, ButtonGroup, Button, TextField, Picker, Item, Link, Text } from "@adobe/react-spectrum";
const { remote } = require("electron");
const path = require("path");
const fs = require("fs-extra");
import { shell } from "electron";
const templateOptions = require("../utils/templateOptions.json");

let options = [
    { name: "Adobe Photoshop" , value: "PS" },
    { name: "Adobe XD" , value: "XD" }
];

let versionRegex = /^\d+(\.\d+){0,3}$/;

const ErrorCode = {
    ALREADY_ADDED: 1,
    DIALOG_CANCELLED: 2
};

async function showFolderPickerDialog() {
    const dialog = remote.dialog;
    const message = "Select the Plugin directory";
    const title = message;
    const options = { message, title , properties:[ "openDirectory", "createDirectory" ] };
    const window = remote.getCurrentWindow();
    const result = await dialog.showOpenDialog(window,options);
    if (result && !result.canceled && Array.isArray(result.filePaths)) {
        return result.filePaths[0];
    }
    return undefined;
}

function openDeveloperConsoleSite() {
    shell.openExternal("https://www.adobe.com/go/xd_create_a_plugin_link");
}

@inject("appViewMgr")
@inject("appViewModel")
@observer
export default class CreatePluginDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            host:"PS",
            hostVersion:"",
            pluginId:"",
            pluginName:"",
            pluginVersion:"",
            pluginDir:"",
            selectedTemplate: undefined,
            pluginNameValid: true,
            pluginVersionValid: true,
            pluginIdValid: true,
            hostValid: true,
            hostVersionValid: true
        };
    }

    async handleSelect() {
        const pickedDir = await showFolderPickerDialog();
        if (!pickedDir) {
            return Promise.reject(ErrorCode.DIALOG_CANCELLED);
        }
        this.setState ({
            pluginDir: pickedDir
        });
    }


    validateForm() {
        this.setState ({
            pluginNameValid: this.state.pluginName !== "",
            pluginVersionValid: (this.state.pluginVersion !== "" && versionRegex.test(this.state.pluginVersion)),
            pluginIdValid: this.state.pluginId !== "",
            hostValid: this.state.host !== "",
            hostVersionValid: (this.state.hostVersion !== "" && versionRegex.test(this.state.hostVersion))
        });
        return (this.state.pluginNameValid && this.state.pluginVersionValid && this.state.pluginIdValid && this.state.hostValid && this.state.hostVersionValid);
    }

    async handleCreatePlugin() {
        const appViewMgr = this.props.appViewMgr;
        if (this.validateForm()) {
            try {
                await this.handleSelect();
            }
            catch(details) {
                if (details == ErrorCode.DIALOG_CANCELLED) {
                    return;
                }
            }
            const params = {
                id: this.state.pluginId,
                name: this.state.pluginName,
                version: this.state.pluginVersion,
                pluginDir: this.state.pluginDir,
                host: [ {
                    app: this.state.host,
                    minVersion: this.state.hostVersion
                } ],
                uiFlag: true,
                selectedTemplate: this.state.selectedTemplate
            };
            const prom = this.props.appViewModel.performAppAction("initPlugin", params);
            return prom.then((response) => {
                this.props.closeHandler();
                if (this.state.selectedTemplate) {
                    this.props.appViewMgr.showInfoDialog();
                }
                return Promise.resolve(response);
            })
                .then((response) => {
                    const manifestPath = path.resolve(params.pluginDir, response.manifestPath || "manifest.json");
                    let buildFolder = undefined;
                    if (response.buildDir && response.buildDir.length > 0) {
                    // the buildDir we get from template will be relative to base template.
                    // we should set the build-directory relative to the manifest file
                        const buildDirFullPath = path.resolve(params.pluginDir, response.buildDir);
                        const manifestDir = path.dirname(manifestPath);
                        buildFolder = path.relative(manifestDir, buildDirFullPath);
                    }
                    const addParam = {
                        manifestPath,
                        pluginOptions: {
                            buildFolder
                        }
                    };
                    const addProm =  this.props.appViewModel.performAppAction("addPlugin", addParam);
                    addProm.then(() => {
                        appViewMgr.showToast("positive", "Plugin Created Successfuly.");
                    })
                        .catch((details) => {
                            const msg = details && details.message || "Create Plugin Failed";
                            UxpAppLogger.verbose(msg, details);
                            if (details.errorCode == 1) {
                                this.props.appViewMgr.showToast("negative", "Plugin with same Id is already present in the Workspace.");
                                return Promise.reject(details.errorCode);
                            }
                            else if (details.errorCode == 3) {
                                // manifest file is not valid.
                                this.props.appViewMgr.showToast("negative", "Plugin Manifest File Is Invalid.");
                                return Promise.reject(details.errorCode);
                            }
                        });
                })
                .catch((details) => {
                    const msg = details && details.message || "Create Plugin Failed";
                    UxpAppLogger.verbose(msg, details);
                    if (details && details.errorCode == 3) {
                        appViewMgr.showToast("negative", "Invalid Directory Permissions.");
                    }
                    else if (details && details.errorCode == 4) {
                        appViewMgr.showToast("negative", "Create Plugin Failed. Directory Contains Conflicting Files.", {
                            action: {
                                label: "Details",
                                handler: () => appViewMgr.showLogsDialog(),
                            }
                        });
                    }
                    else {
                        appViewMgr.showToast("negative", "Create Plugin Failed.");
                    }
                    this.props.closeHandler();
                });
        }
    }

    resetStates(isOpen) {
        if (!isOpen) {
            this.setState ({
                pluginId: "",
                pluginName: "",
                pluginVersion: "",
                host: "",
                pluginDir: "",
                hostVersion: "",
                pluginNameValid: true,
                pluginVersionValid: true,
                pluginIdValid: true,
                hostValid: true,
                hostVersionValid: true
            });
        }
    }


    handlePicker(selected) {
        this.setState ({
            selectedTemplate: selected !== "Select template" ? selected : ""
        });
    }

    getManifestPath() {
        let manifestPath = "";
        if (this.state.selectedTemplate) {
            const pjson = JSON.parse(fs.readFileSync(path.join(this.state.pluginDir,"package.json")));
            manifestPath = path.join(this.state.pluginDir, pjson.uxp.manifestPath);
        }
        else {
            manifestPath = path.join(this.state.pluginDir,"manifest.json");
        }
        return manifestPath;
    }

    handleInput(selected, id) {
        let flag = id + "Valid";
        try {
            this.setState ({
                [id]: selected,
                [flag]: selected !== "" ? true : false
            });
        }
        catch(err) {
            UxpAppLogger.verbose("Create Plugin - Handle Input Error " + err);
        }

    }

    render() {

        return (
            <Dialog>
                <Heading>Create Plugin</Heading>
                <Divider />
                <Content>
                    <Form>
                        <TextField validationState={this.state.pluginNameValid ? "" : "invalid"} label="Plugin Name" value={this.state.pluginName} onChange={(name) => this.handleInput(name,"pluginName")} placeholder="UXP Starter Plugin" isRequired/>
                        <TextField validationState={this.state.pluginIdValid ? "" : "invalid"} label="Plugin Id" value={this.state.pluginId} onChange={(id) => this.handleInput(id,"pluginId")} placeholder="0123ABCD" isRequired/>
                        <Text UNSAFE_className="appPrefsTitleText">Don't have one? Get one by creating a new plugin on the &nbsp;<Link variant="secondary" onPress={openDeveloperConsoleSite}>Adobe Developer Console</Link>.</Text>
                        <TextField validationState={this.state.pluginVersionValid ? "" : "invalid"} label="Plugin Version" value={this.state.pluginVersion} onChange={(version) => this.handleInput(version,"pluginVersion")} placeholder="1.0.0" isRequired/>
                        <Picker validationState={this.state.hostValid ? "" : "invalid"} label="Host Application" selectedKey={this.state.host} placeholder="Select host application" items={options} marginEnd="size-100" flex={1} onSelectionChange={(selected) => selected !== "Select host application" ? this.handleInput(selected,"host") : null} isRequired>
                            {item => <Item key={item.value}>{item.name}</Item>}
                        </Picker>
                        <TextField validationState={this.state.hostVersionValid ? "" : "invalid"} label="Host Application Version" value={this.state.hostVersion} onChange={(hostVer) => this.handleInput(hostVer,"hostVersion")} placeholder="22.0.0" isRequired/>
                        <Picker label="Template" placeholder="Select template" items= {templateOptions[this.state.host]} marginEnd="size-100" flex={1} onSelectionChange={(selected) => this.handlePicker(selected)} isDisabled={this.state.host == ""}>
                            {this.state.host !== "" ? item => <Item key={item.name}>{item.name}</Item> : ""}
                        </Picker>
                    </Form>
                </Content>
                <ButtonGroup>
                    <Button variant="secondary" onPress={this.props.closeHandler}>
                        Cancel
                    </Button>
                    <Button variant="cta" onPress={() => this.handleCreatePlugin()} autoFocus>
                        Select Folder
                    </Button>
                </ButtonGroup>
            </Dialog>
        );
    }
}
