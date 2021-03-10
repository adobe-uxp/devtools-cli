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

import AppController from "./model/AppController";
import AppViewModel from "./viewModel/DevtoolAppViewModel";
import AppElectronMainRuntimeBridge from "./providers/AppElectronMainRuntimeBridge";
import DevtoolsClientMgr from "./providers/DevtoolsClientMgr";

export default class AppInitializer {
    initializeApp(appConfig) {
        if (this._initialized) {
            return;
        }

        const runtimeBridge = new AppElectronMainRuntimeBridge();
        const devtoolsClientMgr = new DevtoolsClientMgr();
        this._appController = new AppController(runtimeBridge, devtoolsClientMgr, appConfig.port);
        this._appViewModel = new AppViewModel(this._appController.appModel);
        this._initialized = true;
        this._startApp();
    }

    _startApp() {
        this._appController.initializeApp();
    }

    get appViewModel() {
        return this._appViewModel;
    }

    get appController() {
        return this._appController;
    }
}
