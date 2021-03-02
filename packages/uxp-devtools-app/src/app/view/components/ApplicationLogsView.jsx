
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
import { Text, Dialog,
    Header, Content, Divider, Flex, StatusLight, Well, Footer, Button, Heading, ButtonGroup } from "@adobe/react-spectrum";
import { observer, inject } from "mobx-react";

@inject("appViewModel")
@observer
export default class ApplicationLogsView extends Component {

    handleClearLogs() {
        this.props.appViewModel.clearLogs();
    }

    render() {
        let batchLogs =  this.props.appViewModel.appLogger.logs;
        batchLogs = batchLogs.filter(batch => batch.logs.length > 0);

        const childLogViews = batchLogs.map((batch, ind) => {
            const details = batch.details || {};
            const batchTitle = details.title ? <Text UNSAFE_style={{ fontWeight: "bold" }}>{details.title}</Text> : null;
            const batchHeader = details.header ? <Text UNSAFE_style={{ fontWeight: "normal" }}>{details.header}</Text> : null;
            const hasHeader = batchTitle || batchHeader;

            return (<Well UNSAFE_className="logCardCls" key={ind}>
                {hasHeader
                    ? (<div className="logEntryHeaderCard">
                        { batchTitle }
                        { batchHeader}
                    </div>) : null
                }
                {
                    batch.logs.map((log, j) => {
                        return (<StatusLight key={j} variant={log.type}>{log.message}</StatusLight>);
                    })
                }
            </Well>);
        });

        return (
            <Dialog size="L">
                <Heading>Application Logs</Heading>
                <Header>Sorted by most recent</Header>
                <Divider />
                <Content>
                    <Flex direction="column">
                        {childLogViews}
                    </Flex>
                </Content>
                <ButtonGroup>
                    <Button variant="cta" onPress={this.props.closeHandler}>Close</Button>
                </ButtonGroup>
                <Footer>
                    <Button variant="secondary" onPress={this.handleClearLogs.bind(this)}>Clear Logs</Button>
                </Footer>
            </Dialog>
        );
    }
}
