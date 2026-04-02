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

import type { ArgumentsCamelCase, CommandModule, Options } from 'yargs';
import path from 'node:path';

interface PackageCommandArgs {
  manifest?: string;
  apps?: string;
  outputPath?: string;
}

interface PackageParams {
  manifest: string;
  packageDir: string;
  apps: string[];
}

interface CommandContext {
  app: {
    client: {
      executePluginCommand: (command: string, params: PackageParams) => Promise<void>;
    };
  };
}

const packageOptions: Record<string, Options> = {
  manifest: {
    describe: 'Relative path to plugin\'s manifest.json file. Defaults to the manifest.json in the current working directory.',
    demandOption: false,
  },
  apps: {
    describe: 'Space delimited list of app IDs for which the plugin should be packaged. The supported app IDs can be retrieved using `uxp apps list`. The default action is to package the plugin for all the apps specified in the plugin\'s manifest.',
    demandOption: false,
  },
  outputPath: {
    describe: 'Output directory path where plugin will be packaged. Defaults to current working directory.',
    demandOption: false,
  },
};

async function handlePluginPackageResult(this: CommandContext, args: ArgumentsCamelCase<PackageCommandArgs>): Promise<void> {
  const manifestRelPath = args.manifest || 'manifest.json';
  let outputDir = args.outputPath;
  const appsList = args.apps ? args.apps.split(' ') : [];
  if (outputDir === undefined || outputDir === '') {
    outputDir = path.dirname(manifestRelPath);
  }
  const params: PackageParams = {
    manifest: manifestRelPath,
    packageDir: outputDir,
    apps: appsList,
  };
  try {
    await this.app.client.executePluginCommand('packagePlugin', params);
    console.log(`Plugin packaged successfully`);
    console.log(`Packaged plugin is available at ${path.resolve(outputDir)}`);
  }
  catch (err: unknown) {
    console.log(`Plugin package command failed: ${err}`);
  }
}

const packageCommand: CommandModule<object, PackageCommandArgs> = {
  command: 'package',
  describe: 'Package the plugin for the target applications',
  handler: handlePluginPackageResult,
  builder: packageOptions,
};

export default packageCommand;
