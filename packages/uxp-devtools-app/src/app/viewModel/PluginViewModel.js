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

import { computed } from "mobx";

export default class PluginViewModel {
    constructor(plugin) {
        this.plugin = plugin;
    }

    @computed
    get name() {
        return this.plugin.manifest.name;
    }

    @computed
    get id() {
        return this.plugin.manifest.id;
    }

    @computed
    get state() {
        return this.plugin.pluginState;
    }

    get pluginHost() {
        return this.plugin.pluginHost;
    }

    get modelId() {
        return this.plugin.modelId;
    }

    get pickedManifestPath() {
        return this.plugin.pickedManifestPath;
    }

    @computed
    get pluginOptions() {
        return this.plugin.pluginOptions;
    }

    @computed
    get isLoaded() {
        return this.plugin.isLoaded;
    }

    @computed
    get isWatched() {
        return this.plugin.isWatched;
    }

    @computed
    get debuggerConnected() {
        return this.plugin.debuggerConnected;
    }

    @computed
    get isCDTInspectOpen() {
        const logWindowOpen = this.plugin.logWindowStatus;
        const debugWindowOpen = this.plugin.debuggerConnected;
        return logWindowOpen || debugWindowOpen;
    }
}
