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

const TestController = require("../utils/Controller");
const { executeCommandSync } = require("../utils/CommandHelper");

describe('appsList Command Tests when app is running', () => {
    const config = {
        versions: ['1.3.7', '3.5.5'],
    };
    const controller = new TestController(config);

    beforeAll(() => {
        return controller.setup();
    });

    afterAll(() => {
        return controller.tearDownSetup();
    });


    test('test apps list commands when apps are running', () => {
        const { result, success } = executeCommandSync('uxp apps list');
        const versionList = config.versions;

        expect(success).toBe(true);
        const appsListCheck = versionList.every((v) => result.includes(v));
        expect(appsListCheck).toBe(true);
    });
});

describe('appsList Command Tests when app is not running', () => {
    const config = {
        versions: [],
    };
    const controller = new TestController(config);

    beforeAll(() => {
        return controller.setup();
    });

    afterAll(() => {
        return controller.tearDownSetup();
    });


    test('test apps list commands when no apps is running', () => {
        const { success } = executeCommandSync('uxp apps list');
        expect(success).toBe(true);
    });
});
