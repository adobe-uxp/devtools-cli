/* eslint-disable no-undef */

const path = require('path');
const TestController = require("../utils/Controller");
const { executeCommandSync } = require("../utils/CommandHelper");
const { pluginPath } = require("../utils/testUtils");


xdescribe("Plugin Debug", () => {
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

    test("Plugin Debug Test", () => {
        const command = `uxp plugin debug`;
        const options = {
            cwd: path.resolve(config.plugin),
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(true);
    });
});
