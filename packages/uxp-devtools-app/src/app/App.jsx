// import { hot } from 'react-hot-loader/root';
import React, { Component } from "react";
import { Provider as MobxProvider } from "mobx-react";

import StartView from "./view/StartView";

import AppViewMgr from "./providers/AppViewMgr";
import AppInitializer from "./AppInitializer";

const sAppInitializer = new AppInitializer();
const sAppViewMgr = new AppViewMgr();

window.addEventListener("beforeunload", () => {
    // Save the current plugin workspace -
    const appController = sAppInitializer.appController;
    if (!appController) {
        return;
    }
    UxpAppLogger.log("Saving the current plugin workspace to preference.");
    appController.saveCurrentPluginWorkspace();
    sAppViewMgr.saveUIPreferences();
});


export default class App extends Component {
    constructor(props) {
        super(props);
        const appConfig = sAppViewMgr.appUIPrefs;
        sAppInitializer.initializeApp(appConfig);
    }

    render() {
        return (
            <MobxProvider appViewModel={sAppInitializer.appViewModel} appViewMgr={sAppViewMgr}>
                <StartView />
            </MobxProvider>
        );
    }
}
