/*
Copyright 2021 Adobe. All rights reserved.
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
import { Flex, Content, Heading, IllustratedMessage, Link, Button, ButtonGroup } from "@adobe/react-spectrum";
import Plug from "@spectrum-icons/workflow/Plug";
import { shell } from "electron";

function openDeveloperConsoleSite() {
    shell.openExternal("https://www.adobe.com/go/xd_create_a_plugin_link");
}

@inject("appViewMgr")
@observer
export default class EmptyPluginWorkspace extends Component {

    createPluginHandler() {
        this.props.appViewMgr.showCreatePluginDialog();
    }

    render() {
        return <div className="empty-plugin-workspace-container">
            <Flex direction="column" justifyContent="center" alignItems="center" >
                <IllustratedMessage>
                    <Plug size="XXL" />
                    <Heading>Add Plugins to your Workspace</Heading>
                    <Content>
                        Your Developer Workspace helps you load and debug your plugins in development.
                        <br />Get started by adding an existing plugin under development to your Workspace, or by creating a new plugin on the &nbsp;
                        <Link variant="secondary" onPress={openDeveloperConsoleSite}>Adobe Developer Console</Link>.
                    </Content>
                </IllustratedMessage>
                <Flex margin="size-300" direction="row">
                    <ButtonGroup>
                        <Button variant="primary" onPress={this.createPluginHandler.bind(this)}>Create Plugin...</Button>
                        <Button variant="cta" onPress={this.props.handleAddPluginClicked}>Add Existing Plugin...</Button>
                    </ButtonGroup>
                </Flex>
            </Flex>

        </div>;
    }
}
