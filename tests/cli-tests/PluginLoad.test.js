/* eslint-disable no-undef */

const path = require("path");
const TestController = require("../utils/Controller");
const { executeCommandSync } = require("../utils/CommandHelper");
const { pluginPath } = require("../utils/testUtils");

const manifestPath = path.resolve(__dirname, '..', 'plugin', 'manifest.json');

describe("Plugin Tests", () => {
    const config = {
        versions: ['1.3.4', '2.3.5'],
    };
    const demoAppId = 'UXPD';
    const controller = new TestController(config);

    beforeEach(() => {
        return controller.setup();
    });

    afterEach(() => {
        return controller.tearDownSetup();
    });

    test("test basic plugin load", () => {
        const command = `uxp plugin load`;
        const options = {
            cwd: pluginPath,
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(true);
    });

    test("test plugin load with manifest option parameter", () => {
        const command = `uxp plugin load --manifest ${manifestPath}`;
        const options = {
            cwd: pluginPath,
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(true);
    });

    test("test plugin load with apps option parameter", () => {
        const command = `uxp plugin load --apps ${demoAppId}`;
        const options = {
            cwd: pluginPath,
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(true);
    });

    test("Loading plugin with invalid manifest path", () => {
        const invalidManifestPath = "./invalid";
        const command = `uxp plugin load --manifest ${invalidManifestPath}`;
        const options = {
            cwd: pluginPath,
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(false);
    });

    test("test plugin load with invalid apps option parameter", () => {
        const invalidDemoAppId = "UXPPD";
        const command = `uxp plugin load --apps ${invalidDemoAppId}`;
        const options = {
            cwd: pluginPath,
        };
        const { success } = executeCommandSync(command, options);
        expect(success).toBe(false);
    });
});
