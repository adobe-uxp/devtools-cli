/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the Licrrense for the specific language
 *  governing permissions and limitations under the License.
 *
 */

const path = require('path');
const fs = require('fs-extra');

const chalk = require('chalk');
const _ = require("lodash");
const { spawn } = require('child_process');
const { sanityCheckPluginDirectory, checkYarnPkg, checkIfOnline } = require('./utils');

const uxpTemplatePath = require.resolve("@adobe/uxp-template-ps-starter", { paths: [__dirname] });
const templatePrefix = "uxp-template-";
const { checkAppsInJson, updatePluginId } = require('./templatePrompts');

function getUxpTemplatePackPath() {
    return path.resolve(
        uxpTemplatePath,
        '..',
        '..',
    );
}

function resolveTemplateToInstall(template, root) {
    let templateToInstall = {};

    // --template file:/path
    if (template.match(/^file:/)) {
        const relativeTemplatePath = template.match(/^file:(.*)?$/)[1];
        templateToInstall = `file:${path.resolve(root, relativeTemplatePath)}`;
    } else {
        // --template uxp-template
        const templatePath = getUxpTemplatePackPath();
        const uxpTemplateList = fs.readdirSync(templatePath);
        templateToInstall = templatePrefix.concat(template);
        if (uxpTemplateList.includes(templateToInstall)) {
            templateToInstall = `file:${path.resolve(templatePath, templateToInstall)}`;
        }
    }
    return templateToInstall;
}

function install(root, dependencies) {
    return new Promise((resolve, reject) => {
        checkIfOnline().then((isOnline) => {
            const command = 'yarn';
            const args = ['add', '--exact'];

            if (!isOnline) {
                args.push('--offline');
            }
            [].push.apply(args, dependencies);
            args.push('--cwd');
            args.push(root);

            if (!isOnline) {
                console.log(chalk.yellow('Unable to connect. Check Internet Connection.'));
                console.log(chalk.yeloow('Falling back to the local Yarn cache.'));
                console.log();
            }

            /* As per https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
             * child_process.spawn() runs without shell (by default). So to get all the shell commands and
             * any executable files available in spawn on Windows, like in your regular shell, set shell: true.
             */
            const options = {
                stdio: 'inherit',
                shell: process.platform === 'win32'
            }

            const child = spawn(command, args, options);
            child.on('close', (code) => {
                if (code !== 0) {
                    // eslint-disable-next-line prefer-promise-reject-errors
                    reject({
                        command: `${command} ${args.join(' ')}`,
                    });
                    return;
                }
                resolve({ success: true });
            });
        });
    });
}


function installTemplateDependencies(template, root) {
    let templateName = template;

    // Extract template name from file:/template_path
    if (template.match(/^file:/)) {
        const source = template.match(/^file:(.*)?$/)[1];
        const { name } = require(path.join(source, 'package.json'));
        templateName = name;
    }

    const templatePath = path.join(
        require.resolve(templateName, { paths: [root] }),
        '..',
    );

    // Get template.json details;
    const templateJsonPath = path.join(templatePath, 'template.json');
    let templateJson = {};
    if (fs.existsSync(templateJsonPath)) {
        templateJson = require(templateJsonPath);
    }

    // Copy README.md if it exists.
    const readmeExists = fs.existsSync(path.join(templatePath, 'README.md'));
    if (readmeExists) {
        fs.writeFileSync(
            path.join(templatePath, 'README.md'),
            path.join(templatePath, 'README.old.md'),
        );
    }

    // Copy template folder to the directory
    const templateDir = path.join(templatePath, 'template');
    if (fs.existsSync(templateDir)) {
        fs.copySync(templateDir, root);
    } else {
        throw new Error('Template directory not found.');
    }

    // Prepare to Install template dependencies.
    const templateDependencies = templateJson.dependencies || templateJson.package.dependencies;
    let args = ['add'];
    if (templateDependencies) {
        args = args.concat(
            Object.keys(templateDependencies).map((key) => {
                return `${key}@${templateDependencies[key]}`;
            }),
        );
    }

    // Launch yarn for template dependencies.
    if (args.length > 1) {
        console.log();
        console.log(`Installing template dependencies...`);
        install(root, args).then((response) => {
            return response;
        });
    }

    return ({ success: true });
}


/* Installation Steps:
    1. Install the template package in plugin directory. Installation creates a directory in node_module.
    2. Copy files from installed package to plugin directory.
    3. Install dependencies from template.json
*/
function installPluginFromTemplate(template, root) {
    const templateToInstall = resolveTemplateToInstall(template, root);
    const installTemplateProm = install(root, [templateToInstall]);


    return installTemplateProm.then(() => {
        // 1. Move template from node_modules to plugin directory.
        // 2. Install dependecies from template.json.
        return installTemplateDependencies(templateToInstall, root);
    }).then((response) => {
        if (!response.success) {
            throw new Error('Unexpected error occurred.');
        }

        // Installation complete.
        // Check for app list in manifest.json.
        console.log(chalk.green(`\nPlugin successfully created.\n`));
        return checkAppsInJson(root);
    })
        .then((response) => {
            if (!response.success) {
                throw new Error('Unexpected error occurred.');
            }
            // Prompt user to update pluginId.
            return updatePluginId(root);
        })
        .then((response) => {
            if (response.success === true) {
                return response;
            }
            throw new Error('Unexpected error occurred.');
        });
}


// For reference check:
// https://github.com/facebook/create-react-app/blob/master/packages/create-react-app/createReactApp.js
function createPluginFromTemplate(template) {
    const templateName = template;
    const root = process.cwd();
    const pluginName = path.basename(root);

    const packageJson = {
        name: pluginName,
        version: '0.1.0',
        private: true,
    };

    sanityCheckPluginDirectory(root);

    console.log(
        `Initializing ${chalk.cyan(pluginName)} as an uxp-plugin.`,
    );

    // Initialize package.
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson, null, 2),
    );

    // Check if yarn is present.
    checkYarnPkg();

    const installTemplate = installPluginFromTemplate(templateName, root);

    return installTemplate.then((response) => {
        if (!response.success) {
            throw new Error('Plugin initialization from template failed.');
        }
        return response;
    });
}


module.exports = {
    createPluginFromTemplate,
};
