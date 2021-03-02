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

const chalk = require("chalk");
const BasicInitWorkflow = require("./init/BasicInitWorkflow");
const { initWithBundledPluginTemplate } = require("./init/TemplateBasedInitWorkflow");
const { DevToolsError } = require("@adobe/uxp-devtools-core");

const templateHelp = `Specify a template for the plugin.
                    A custom ${chalk.cyan("--template")} can be one of:
                    - Predefined template: ${chalk.green("ps-starter")}
                    - [In future versions] a custom fork published on npm: ${chalk.green("uxp-template-<template_name>")}
                    - [In future versions] a local path relative to the current working directory: ${chalk.green("file:../my-custom-template")}`;

const initOptions = {
    template: {
        describe: templateHelp,
        demandOptions: false,
        type: "string",
        nargs: 1,
    },
};

function handlePluginInitCommand(args) {
    let prom = null;
    if (args.template) {
        const currentDir = process.cwd();
        result = initWithBundledPluginTemplate(currentDir, args.template);
        if (!result.success) {
            prom = Promise.reject(result.error);
        }
        else {
            prom = Promise.resolve(true);
        }
    }
    else {
        const initWorkflow = new BasicInitWorkflow();
        prom = initWorkflow.execute();
    }

    return prom.then((res) => {
        console.log(
            chalk.green(`\nSuccessfully initialized UXP Plugin in the given directory\n`),
        );
        return res;
    })
        .catch((err) => {
            console.log(chalk.red(`Failed to initialize UXP Plugin in the given directory.`));
            const failureMsg = DevToolsError.getUserFriendlyMessageFromCode(err) ? DevToolsError.getUserFriendlyMessageFromCode(err) : err;
            console.log(chalk.red(failureMsg));
        });
}


const initCommand = {
    command: "init",
    description: "Initializes the current directory as plugin. The plugin can be initialized using a template also.",
    handler: handlePluginInitCommand,
    builder: initOptions,
};

module.exports = initCommand;
