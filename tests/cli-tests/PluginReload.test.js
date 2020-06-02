/* eslint-disable no-undef */

const path = require('path');
const TestController = require("../utils/Controller");
const { executeCommandSync } = require("../utils/CommandHelper");
const { pluginPath } = require("../utils/testUtils");

describe("Plugin Reload", () => {
    const config = {
        versions: ['1.3.7'],
        plugin: pluginPath,
    };
    const controller = new TestController(config);

    beforeEach(() => {
        /**
         * the plugin will be loaded as part of the setup
         * due to specifying pluginPath in the config and
         * that we will test only specific command here
         */
        return controller.setup();
    });

    afterEach(() => {
        return controller.tearDownSetup();
    });

    test("Reload", () => {
        const command = `uxp plugin reload`;
        const options = {
            cwd: path.resolve(config.plugin),
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(true);
    });
});
