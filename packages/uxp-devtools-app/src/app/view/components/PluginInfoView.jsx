
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
import { Dialog, Heading , Content, Divider, ButtonGroup, Button, Text } from "@adobe/react-spectrum";
import { observer, inject } from "mobx-react";

@inject("appViewModel")
@observer
export default class PluginInfoView extends Component {


    render() {
        return (
            <Dialog size="L">
                <Heading>Plugin Created Successfully</Heading>
                <Divider />
                <ButtonGroup>
                    <Button variant="cta" onPress={this.props.closeHandler}>
                Ok
                    </Button>
                </ButtonGroup>
                <Content>
                    <Text>Note: You will need to run additional commands from your terminal in order to install various dependencies and to build the plugin. Please consult the README file in the newly created plugin for full steps.</Text>
                </Content>
            </Dialog>
        );
    }
}
