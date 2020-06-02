/* eslint-disable no-undef */
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

const path = require('path');
const TestController = require("../utils/Controller");
const { executeCommandSync } = require("../utils/CommandHelper");
const { pluginPath } = require("../utils/testUtils");


describe("Plugin log path", () => {
    const config = {
        versions: ['1.3.7'],
        plugin: pluginPath,
    };
    const controller = new TestController(config);

    beforeEach(() => {
        return controller.setup();
    });

    afterEach(() => {
        return controller.tearDownSetup();
    });

    test("Plugin Log Path", () => {
        const command = `uxp plugin log path`;
        const options = {
            cwd: path.resolve(config.plugin),
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(true);
    });
});
