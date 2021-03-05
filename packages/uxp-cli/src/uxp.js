#!/usr/bin/env node
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
/* eslint-disable global-require */
const Tool = require("./cli/utils/Tool");
const DevToolsMgr = require("./core/common/DevToolsMgr");
const ServiceMgr = require("./core/service/ServiceMgr");
const PluginMgr = require("./core/client/PluginMgr");

const commands = [
    require("./cli/commands/apps/index"),
    require("./cli/commands/devtools/index"),
    require("./cli/commands/plugin/index"),
    require("./cli/commands/service/index"),
    require("./cli/commands/plugin/init"),
];

class UxpDevTools {
    constructor() {
        this._serviceMgr = new ServiceMgr(this);
        this._pluginMgr = new PluginMgr(this);
    }

    run(args = process.argv.slice(2)) {
        const tool = new Tool(this, commands);
        tool.run(args);
    }

    setMode(mode) {
        const isServer = mode === "service";
        if (!this._devToolsMgr) {
            this._devToolsMgr = new DevToolsMgr(isServer);
        }
    }

    get devToolsMgr() {
        return this._devToolsMgr;
    }

    get serviceMgr() {
        return this._serviceMgr;
    }

    get pluginMgr() {
        return this._pluginMgr;
    }
}

const uxp = new UxpDevTools();
uxp.run();