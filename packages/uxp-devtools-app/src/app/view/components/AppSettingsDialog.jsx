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
import Settings from "@spectrum-icons/workflow/Settings";
import TextAlignJustify from "@spectrum-icons/workflow/TextAlignJustify";

import { ActionButton, DialogTrigger, Dialog, Content,
    Divider, Heading, TextField, Item, Flex, Text,
    Picker } from "@adobe/react-spectrum";
import { observable } from "mobx";


const settingsState = observable({
    portValid: true,
    showPortHelp: false
});


@inject("appViewMgr")
@observer
export default class AppSettingsDialog extends Component {

    onThemeChange(theme) {
        this.props.appViewMgr.appUIPrefs.setAppTheme(theme);
    }

    handleLogsClick() {
        this.props.appViewMgr.showLogsDialog();
    }

    handlePortChange(input) {
        settingsState.showPortHelp = true;
        let validPort = false;
        const port = +input;
        if (!isNaN(port)) {
            validPort = port > 1 && port < 65535;
        }
        settingsState.portValid = validPort;
        if (validPort) {
            this.props.appViewMgr.appUIPrefs.setServicePort(port);
        }
    }

    handleDialogOpenChange(open) {
        if (!open) {
            settingsState.showPortHelp = false;
        }
    }

    render() {
        const appPrefs = this.props.appViewMgr.appUIPrefs;
        const currentTheme = appPrefs.theme;
        const port = appPrefs.port;
        const portState = settingsState.portValid ? "valid" : "invalid";
        return (
            <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "row" }}>
                <ActionButton isQuiet="true" onPress={this.handleLogsClick.bind(this)}>
                    <TextAlignJustify />
                </ActionButton>
                <DialogTrigger type="popover" placement="bottom" onOpenChange={this.handleDialogOpenChange.bind(this)}>
                    <ActionButton isQuiet="true">
                        <Settings />
                    </ActionButton>
                    <Dialog>
                        <Heading>Preferences</Heading>
                        <Divider />
                        <Content>
                            <Flex direction="column" gap="size-100">
                                <TextField label="Service Port" isRequired necessityIndicator="icon"  validationState={portState} defaultValue={port} onChange={this.handlePortChange.bind(this)}/>
                                { settingsState.showPortHelp
                                    ? <Text UNSAFE_className="appPrefsTitleText">You need to restart the App for port changes to take effect</Text>
                                    : null
                                }
                                <Picker label="UI Theme"
                                    selectedKey={currentTheme}
                                    onSelectionChange={this.onThemeChange.bind(this)}>
                                    <Item key="light">Light</Item>
                                    <Item key="dark">Dark</Item>
                                </Picker>
                            </Flex>
                        </Content>
                    </Dialog>
                </DialogTrigger>
            </div>
        );
    }
}
