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
import { Text, Flex } from "@adobe/react-spectrum";
import Home from "@spectrum-icons/workflow/Home";
import AppSettingsDialog from "./AppSettingsDialog";

export default class AppMenuBar extends Component {

    componentDidMount() {
        const isWin = process.platform == "win32";
        if (!isWin) {
            // On Windows, unlike mac, the App Bar doesn't include window controls like traffic lights - so,
            // We don't need to left shift the Home button and text with padding - so, to reset that we are
            // programatically handling it here.
            return;
        }
        const appBar = document.getElementById("appMainTitleBarContainer");
        if (appBar) {
            appBar.style.paddingLeft = "1rem";
        }
    }

    render() {
        return (
            <div className="mainAppTitlebar" id="appMainTitleBarContainer" >
                <Flex direction="row" gap="size-100" alignItems="center" flexGrow="1">
                    <Home />
                    <Text>UXP Developer Tool</Text>
                    <Flex direction="column" flexGrow="1" height="100%" justifyContent="center" marginEnd="size-200">
                        <AppSettingsDialog  />
                    </Flex>

                </Flex>
            </div>
        );
    }
}
