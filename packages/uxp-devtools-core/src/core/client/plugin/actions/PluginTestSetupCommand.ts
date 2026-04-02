/*
 *  Copyright 2021 Adobe Systems Incorporated. All rights reserved.
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

import type PluginMgr from '../../PluginMgr.js';
import type { TestParams } from './PluginTestBaseCommand.js';
import path from 'node:path';
import chalk from 'chalk';
import PluginTestBaseCommand from './PluginTestBaseCommand.js';

class PluginTestSetupCommand extends PluginTestBaseCommand {
  protected override params: TestParams;

  constructor(pluginMgr: PluginMgr, params?: TestParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'SetupTest';
  }

  override validateParams(): Promise<boolean> {
    if (!this.params) {
      this.params = {
        apps: [],
      };
    }
    return Promise.resolve(true);
  }

  override executeCommand(): void {
    const pluginFolder = path.dirname(this.params.manifest!);
    const packageName = this.params.packageName!;
    console.log(chalk.green('Setup uxp-plugin-tests files at'), chalk.yellow(process.cwd()));
    const prom = this.initWithBundledTest(pluginFolder, packageName);
    prom.then(() => {
      this.installTestDependency();
      return true;
    }).catch(() => {
      return false;
    });
  }
}

export default PluginTestSetupCommand;
