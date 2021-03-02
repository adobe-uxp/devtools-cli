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
import DevtoolsMainView from "./DevtoolsMainView";

import { Provider } from "@react-spectrum/provider";
import { defaultTheme } from "@adobe/react-spectrum";
import AppMenuBar from "./components/AppMenuBar";
import AppModelState from "../common/AppModelState";

import { Flex, View, Heading, ProgressBar } from "@adobe/react-spectrum";

import "./styles.css";

@inject("appViewMgr")
@inject("appViewModel")
@observer
export default class StartView extends Component {
    render() {
        const appPrefs = this.props.appViewMgr.appUIPrefs;
        const colorScheme = appPrefs.theme == "auto" ? undefined : appPrefs.theme;
        const appState = this.props.appViewModel.appState;
        const isAppInitializing = (appState == AppModelState.BOOTING) || (appState == AppModelState.INITIALIZING);
        return (<Provider theme={defaultTheme} colorScheme={colorScheme}>
            <div className="mainHostContainer">
                <AppMenuBar />
                {
                    isAppInitializing
                        ? (<View flexGrow="1" backgroundColor="gray-50">
                            <Flex height="100%" width="100%" direction="column" justifyContent="center" alignItems="center" >
                                <Heading >Initializing Application ... </Heading>
                                <ProgressBar label="" isIndeterminate />

                            </Flex>
                        </View>)
                        : (<DevtoolsMainView />)
                }

            </div>
        </Provider>);
    }
}
