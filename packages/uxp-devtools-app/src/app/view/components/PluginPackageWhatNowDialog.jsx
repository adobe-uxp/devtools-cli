
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
import { Dialog, Heading , Content, Divider, ButtonGroup, Button, Text, Link } from "@adobe/react-spectrum";
import { observer, inject } from "mobx-react";
import { shell } from "electron";

function openDeveloperConsoleSite() {
    shell.openExternal("https://www.adobe.com/go/xd_create_a_plugin_link");
}

@inject("appViewModel")
@observer
export default class PluginPackageWhatNowDialog extends Component {


    render() {
        return (
            <Dialog size="M">
                <Heading>Now that you've created a Creative Cloud Plugin package, you might consider:</Heading>
                <Divider />
                <ButtonGroup>
                    <Button variant="cta" onPress={this.props.closeHandler}>
                Ok
                    </Button>
                </ButtonGroup>
                <Content>
                    <ul>
                        <li><Text>Letting the world use your plugin. You can upload it to the <Link onPress={openDeveloperConsoleSite}>Adobe Developer Console</Link> for deployment via plugin marketplace.</Text></li>
                        <li><Text>Uploading the plugin to a website that you own for beta testing with your own users.</Text></li>
                        <li><Text>Sending your plugin via file-sharing utilities to your team members so that they can use it too!</Text></li>
                    </ul>
                    <br/>
                    <Text>Note: If you aren't distributing via the plugin marketplace, your users can just double-click on the package you send them to install it on their system.</Text>
                </Content>
            </Dialog>
        );
    }
}
