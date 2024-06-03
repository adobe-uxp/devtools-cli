const yargs = require("yargs");

/* These configuration variables are needed for connecting UXP Developer Tools CLI with UXPDriver and the UXP Plugin. */

const testRunParam = yargs.argv;
const  driverPort = testRunParam.driverPort;
const servicePort = testRunParam.servicePort;
const uxpAppId = testRunParam.app;
const uxpPluginId = testRunParam.uxpPluginID;


exports.config = {

    runner: "local",
    specs: [
        "./sample-tests/specs/*.js"
    ],
    exclude: [
        // 'path/to/excluded/files'
    ],

    // uxp-plugin-tests currently support  " maxInstances: 1 ".  
    maxInstances: 1,
    capabilities: [ {
        browserName: "chrome",
        "goog:chromeOptions": {
            args: [ `--adobe-uxp-app-id=${uxpAppId}`,
                `--adobe-uxp-plugin-id=${uxpPluginId}` ],
            debuggerAddress: `http://127.0.0.1:${servicePort}`,
        }
    } ],
    hostname: "localhost",
    port: driverPort,
    path: "/wd/hub",
    logLevel: "info",
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    reporters: [ "spec" ],
    mochaOpts: {
        ui: "bdd",
        timeout: 60000
    },
};
