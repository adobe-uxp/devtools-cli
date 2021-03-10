/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
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

import React, { Component } from "react";
import { View, Dialog, Divider, DialogTrigger,
    Content, Heading,
    ButtonGroup,  Button, Flex, Checkbox, Header, TextField, Text } from "@adobe/react-spectrum";

import ChevronRight from "@spectrum-icons/workflow/ChevronRight";

export default class PluginLoadOptionsDialog extends Component {
    constructor(props) {
        super(props);
        const options =  props.plugin.pluginOptions;
        this.state = {
            breakOnStart: options.breakOnStart,
            buildFolder: options.buildFolder || "",
        };
    }

    handleDoneClick(close) {
        const commitHandler = this.props.commitHandler;
        close();
        commitHandler("loadOptionsPlugin", this.props.plugin, {
            breakOnStart: this.state.breakOnStart,
            buildFolder: this.state.buildFolder
        });
    }

    onBOSChange(selected) {
        this.setState({
            breakOnStart: selected
        });
    }

    handlePluginBuildFolderChange(input) {
        this.setState({
            buildFolder: input
        });
    }

    render() {
        return (<DialogTrigger defaultOpen={true} isKeyboardDismissDisabled>
            <View></View>
            {
                (close) => (
                    <Dialog>
                        <Heading>Plugin Options</Heading>
                        <Header>{this.props.plugin.id}</Header>
                        <Divider />
                        <Content>
                            <Flex direction="column">
                                <Checkbox isSelected={this.state.breakOnStart} onChange={this.onBOSChange.bind(this)}>Break on Start</Checkbox>
                                <details >
                                    <summary >
                                        <ChevronRight size="S" />
                                        <Text UNSAFE_style={{ fontWeight:"bold" }} >Advanced</Text>
                                    </summary>
                                    <View direction="column" paddingX="size-200" paddingY="size-125">
                                        <Flex direction="column">
                                            <TextField label="Plugin Build Folder" defaultValue={this.state.buildFolder}  onChange={this.handlePluginBuildFolderChange.bind(this)}/>
                                            <Text UNSAFE_className="appPrefsTitleText"><sub>*</sub>Path should be relative to the selected manifest.json file.</Text>
                                        </Flex>
                                    </View>
                                </details>

                            </Flex>
                        </Content>
                        <ButtonGroup>
                            <Button variant="secondary" onPress={this.props.close}>Cancel</Button>
                            <Button variant="cta" onPress={() => this.handleDoneClick(close)} autoFocus>
                                Save
                            </Button>
                        </ButtonGroup>
                    </Dialog>)
            }
        </DialogTrigger>);
    }
}
