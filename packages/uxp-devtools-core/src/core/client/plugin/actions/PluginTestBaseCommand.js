/** ***********************************************************************
*ADOBE CONFIDENTIAL **Copyright 2021 Adobe
*All Rights Reserved.
*
*NOTICE:  All information contained herein is, and remains
*the property of Adobe and its suppliers, if any. The intellectual
*and technical concepts contained herein are proprietary to Adobe
*and its suppliers and are protected by all applicable intellectual
*property laws, including trade secret and copyright laws.
*Dissemination of this information or reproduction of this material
*is strictly forbidden unless prior written permission is obtained
*from Adobe.
**************************************************************************/

const path = require("path");
const fs = require("fs-extra");
const { spawn, fork } = require("child_process");
const fsPromises = require("fs").promises;
const _ = require("lodash");

const PluginBaseCommand = require("./PluginBaseCommand");


class PluginTestBaseCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
        this.pluginTestFolder = "uxp-plugin-tests";
        this.pluginFolder = process.cwd();
    }

    getSupportedHostApp(applicableApps) {
        const supportedHostApp = (this.params.apps.length ? this.params.apps[0] : applicableApps[0].id);
        return supportedHostApp.toString();

    }

    async startTestService(applicableApps) {
        const UXPDriverPort = this.params.driverPort;

        process.chdir(this.pluginTestFolder);
        const logPath =  path.resolve(process.cwd(), "uxp-plugin-test-logs");
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, { recursive: true });
        }
        const logFileName = "uxp-plugin-test_" + this.getSupportedHostApp(applicableApps) + ".log";
        const uxpDriver_logFilePath = path.resolve(logPath , logFileName).toString();
        const uxpDriver_logFile = await fsPromises.open(uxpDriver_logFilePath,  "w+");

        let uxpDevtoolCoreDir =  require.resolve("@adobe-fixed-uxp/uxp-devtools-core/package.json");
        uxpDevtoolCoreDir = path.dirname(uxpDevtoolCoreDir);
        process.chdir(uxpDevtoolCoreDir);

        const uxpTestService =  await  fork("./startUxpDriver.js",[ UXPDriverPort ], {
            stdio: [ "inherit" , uxpDriver_logFile, uxpDriver_logFile, "ipc" ],
            cwd: uxpDevtoolCoreDir,
            shell: process.platform === "win32"
        });

        const testServiceStopHandler = async function() {
            console.log("Terminating UXP TestService");
            await uxpTestService.kill("SIGINT");
            await  uxpDriver_logFile.close();
        };

        process.on("SIGTERM", testServiceStopHandler);
        process.on("SIGINT", testServiceStopHandler);
        process.on("exit", testServiceStopHandler);
    }

    createUXPPluginTestRunParams(params, applicableApps, pluginID) {

        const supportedHostApp = "--app=" + this.getSupportedHostApp(applicableApps);
        const driverPort = "--driverPort=" + params.driverPort;
        const udtServicePort = "--servicePort=" + params.servicePort;
        const uxpPluginID = "--uxpPluginID=" + pluginID;


        const pluginTestRunParams = {
            supportedHostApp,
            driverPort,
            udtServicePort,
            uxpPluginID
        };
        return pluginTestRunParams;
    }

    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async executeTest(params, applicableApps, pluginID) {
        await this.startTestService(applicableApps);
        await this.timeout(1500);
        const pluginTestsPath =  path.resolve(this.pluginFolder, this.pluginTestFolder);
        process.chdir(pluginTestsPath);

        const testParams = this.createUXPPluginTestRunParams(params, applicableApps, pluginID);
        return new Promise((resolve, reject) => {
            const cmd = "yarn";
            const args = [ "uxp-plugin-tests", testParams.driverPort, testParams.udtServicePort, testParams.supportedHostApp, testParams.uxpPluginID ];
            const options = {
                stdio: "inherit",
                shell: process.platform === "win32"
            };
            const testCommand = spawn(cmd, args, options);
            testCommand.on("error", (err) => {
                reject(err);
                process.exit();
            });

            testCommand.on("close", (code) => {
                if (code == 0) {
                    resolve(true);
                }
                process.exit();
            });
        });
    }


    initWithBundledTest(pluginDir,packageName) {

        const packageJsonFile = `${packageName}/package.json`;
        const templatePackageDir = require.resolve(packageJsonFile);
        const tempalteDir =  path.dirname(templatePackageDir);
        const origTestDir = path.resolve(tempalteDir);
        const destTestDir = path.join(pluginDir, this.pluginTestFolder);

        if(!fs.existsSync(destTestDir)) {
            fs.mkdirSync(destTestDir);
        }
        else {
            let unsafeFiles = [
                "package.json",
                "wdio.conf.js",
                "nightwatch.conf.js"
            ];
            const fileNames = fs.readdirSync(destTestDir);
            const conflictingNames = _.intersection(fileNames, unsafeFiles);
            if (conflictingNames.length) {
                throw new Error("Conflicting files " + conflictingNames + " exists at " + destTestDir);
            }
        }
        fs.copySync(origTestDir, destTestDir);
        return Promise.resolve(true);
    }




    installTestDependency() {
        process.chdir(this.pluginTestFolder);

        return new Promise((resolve, reject) => {
            const command = "yarn";
            const args = [ "install" ];
            const options = {
                stdio: "inherit",
                shell: process.platform === "win32"
            };
            const installDependency = spawn(command, args, options);
            installDependency.on("close", (code) => {
                if (code !== 0) {
                    reject({
                        command: `${command} ${args.join(" ")}`,
                    });
                    return;
                }
                resolve({ success: true });

            });
        });
    }

}
module.exports = PluginTestBaseCommand;
