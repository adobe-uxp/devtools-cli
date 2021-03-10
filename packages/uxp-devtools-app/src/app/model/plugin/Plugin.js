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

import { observable, action, computed } from "mobx";
import { PluginState } from "./PluginAttrs";
import { readPluginManifest } from "./PluginHelper";
import path from "path";

let sPluginModelId = 1;

class Plugin {
    @observable pluginState;
    @observable manifest;
    @observable serviceSession;
    @observable logWindowStatus;
    @observable watched;

    constructor({ pickedManifestPath }, pluginhost) {
        this._modelId = sPluginModelId++;
        this._pickedManifestPath = pickedManifestPath;
        this.pluginState = PluginState.READY;
        this.pluginOptions = observable({
            breakOnStart: false,
            buildFolder: undefined
        });
        this._debuggerStatus = observable({
            valid: false,
            connected: false
        });
        this.watched = false;
        this._pluginHost = pluginhost;
        this.fillManifestDetails();
    }

    get pickedManifestPath() {
        return this._pickedManifestPath;
    }

    get modelId() {
        return this._modelId;
    }

    get pluginHost() {
        return this._pluginHost;
    }

    get manifestPath() {
        // we need to return the final manifest path that will be loaded into uxp.
        const buildFolder = this.pluginOptions.buildFolder;
        if (typeof buildFolder === "string" && buildFolder.length > 0) {
            // build folder is valid - so, pick the manifest file within this folder.
            const pickedManifestDir = path.dirname(this._pickedManifestPath);
            const pluginManifestInBuild = path.resolve(pickedManifestDir, buildFolder, "manifest.json");
            return pluginManifestInBuild;
        }
        return this._pickedManifestPath;
    }

    fillManifestDetails() {
        const manifest = readPluginManifest(this._pickedManifestPath);
        this.manifest = manifest;
        this.pluginState = PluginState.READY;
    }

    @action
    setPluginState(state) {
        this.pluginState = state;
    }

    @action
    setWatched(status) {
        this.watched = status;
        this.updatePluginState();
    }

    @action
    setPluginOptions({ breakOnStart = undefined, buildFolder = undefined }) {
        if (typeof breakOnStart === "boolean") {
            this.pluginOptions.breakOnStart = breakOnStart;
        }
        if (typeof buildFolder === "string") {
            this.pluginOptions.buildFolder = buildFolder;
        }
    }

    @computed
    get isLoaded() {
        return !!this.serviceSession;
    }

    @computed
    get isWatched() {
        return !!this.watched;
    }

    // TODO - these should ideally by in the ViewModel.
    @action
    setLogWindowStatus(opened) {
        this.logWindowStatus = opened;
    }

    @action
    setDebuggerStatus(connected) {
        this._debuggerStatus.valid = true;
        this._debuggerStatus.connected = connected;
        this.updatePluginState();
    }

    @computed
    get debuggerConnected() {
        return this._debuggerStatus.valid && this._debuggerStatus.connected;
    }

    @action
    updatePluginState() {
        let state = PluginState.DEFAULT;
        if (this.isLoaded) {
            state = PluginState.LOADED;
            if (this.isWatched) {
                state = PluginState.WATCHING;
            }
            if (this._debuggerStatus.valid) {
                if (this._debuggerStatus.connected) {
                    state = PluginState.DEBUGGING;
                }
            }
            else if (this.pluginOptions.breakOnStart) {
                state = PluginState.WAITING_FOR_DEBUGGER;
            }
        }

        this.setPluginState(state);
    }

    @action
    setServiceSession(session) {
        this.serviceSession = session;
        this._debuggerStatus.valid  = false; // reset debugger status on new session.
        this.updatePluginState();
    }

}

export default Plugin;
