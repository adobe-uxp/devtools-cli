/* eslint-disable class-methods-use-this */
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

import { observable } from "mobx";
import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { View, Dialog, Divider, DialogTrigger,
    Content, Heading,
    ButtonGroup,  Button, Link } from "@adobe/react-spectrum";

import { shell } from "electron";


class EnableDialogState {
    @observable state;
    constructor() {
        this.state = "initial";
    }
}


const dialogState = new EnableDialogState();

function handleTermsOfUse() {
    shell.openExternal("https://www.adobe.com/legal/terms.html");
}

function handleAdditionalDevTerms() {
    shell.openExternal("http://www.adobe.com/go/developer-terms");
}

@inject("appViewMgr")
@inject("appViewModel")
@observer
export default class EnableDevtoolsDialog extends Component {

    handleQuit() {
        this.props.appViewMgr.quitApp({
            reason: "User cancelled Enable Devtools Prompt"
        });
    }

    handleEnableDevtools(closeDialog) {
        const prom = this.props.appViewModel.performAppAction("enableDevtools");
        return prom.then((result) => {
            if (result) {
                closeDialog();
            }
            else {
                dialogState.state = "initial";
            }
        });
    }

    showPrivilegedReqDialog() {
        dialogState.state = "acceptReqs";
    }

    previlegeReqCancelled() {
        dialogState.state = "initial";
    }

    render() {

        return  (<DialogTrigger isKeyboardDismissDisabled defaultOpen={true} type="modal">
            <View></View>
            {
                (close) => (
                    <Dialog>
                        <Heading>Enable Developer Mode</Heading>
                        <Divider />
                        <Content>
                                Developer Mode needs to be enabled in order to load and debug UXP plugins that you are currently developing.
                            <br />
                            <br />
                                Note: Administrator privileges are required to enable Developer Mode.
                            <br />
                            <br />
                                Use of the UXP Developer Tools is subject to the Adobe <Link onPress={handleTermsOfUse}>Terms of Use</Link>&nbsp;and Developer Additional&nbsp;
                            <Link onPress={handleAdditionalDevTerms}>Terms of Use</Link>.
                        </Content>
                        <ButtonGroup>
                            <Button variant="secondary" onPress={this.handleQuit.bind(this)}>Quit</Button>
                            <Button variant="cta" onPress={() => this.handleEnableDevtools(close)} autoFocus>
                                Enable
                            </Button>
                        </ButtonGroup>
                    </Dialog>)
            }
        </DialogTrigger>);
    }
}
