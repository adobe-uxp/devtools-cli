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

import { observable } from "mobx";

export default class PluginManifest {
    // plugin id in the manifest.
    @observable id;

    // plugin name
    @observable name;

    // plugin apps list
    @observable hostApps;

    constructor(id, name, hosts) {
        this.id = id;
        // name can be string or object ( for list of localized names ) - if its an object then pick the default one.
        // TODO(craj) - whats the behavior we want here - if name is localized.
        const isLocalizedName = typeof name === "object";
        this.name = isLocalizedName ? name.default : name;
        this.hostApps = hosts;
    }
}
