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
import { ActionButton, DialogTrigger, Dialog,
    ProgressCircle, Header, Content, Divider } from "@adobe/react-spectrum";

export default class InitializationView extends Component {
    render() {
        return (
            <DialogTrigger isDismissable={false}>
                <ActionButton>Start Initialization</ActionButton>
                <Dialog width="size-800">
                    <Header>Initializing App...</Header>
                    <Divider />
                    <Content>
                        <ProgressCircle aria-label="Initializing App..." isIndeterminate />
                    </Content>
                </Dialog>
            </DialogTrigger>
        );
    }
}
