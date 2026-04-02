/**
 * ***********************************************************************
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
 *************************************************************************
 */

import type { ChildProcess } from 'node:child_process';
import type { AppEndPoint } from '../../../../types/index.js';
import type PluginMgr from '../../PluginMgr.js';
import type { CommandParams } from './PluginBaseCommand.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

import { createRequire } from 'node:module';
import path from 'node:path';
import { intersection } from 'lodash-es';
import PluginBaseCommand from './PluginBaseCommand.js';

const require = createRequire(import.meta.url);

export interface TestParams extends CommandParams {
  apps?: string[];
  manifest?: string;
  driverPort?: number;
  servicePort?: number;
  packageName?: string;
}

export interface PluginTestRunParams {
  supportedHostApp: string;
  driverPort: string;
  udtServicePort: string;
  uxpPluginID: string;
}

class PluginTestBaseCommand extends PluginBaseCommand {
  protected override params: TestParams;
  protected pluginTestFolder: string;
  protected pluginFolder: string;

  constructor(pluginMgr: PluginMgr, params?: TestParams) {
    super(pluginMgr);
    this.params = params || {};
    this.pluginTestFolder = 'uxp-plugin-tests';
    this.pluginFolder = process.cwd();
  }

  getSupportedHostApp(applicableApps: AppEndPoint[]): string {
    if (!this.params.apps) {
      throw new Error('No apps found in params');
    }
    const firstApp = this.params.apps[0];
    if (!firstApp) {
      throw new Error('No first app found in params');
    }
    const firstApplicableApp = applicableApps[0];
    if (!firstApplicableApp) {
      throw new Error('No first applicable app found in params');
    }
    const supportedHostApp = firstApp ?? firstApplicableApp.id;
    return supportedHostApp;
  }

  async startTestService(_applicableApps: AppEndPoint[]): Promise<void> {
    throw new Error('Not implemented');
  }

  createUXPPluginTestRunParams(params: TestParams, applicableApps: AppEndPoint[], pluginID: string): PluginTestRunParams {
    const supportedHostApp = `--app=${this.getSupportedHostApp(applicableApps)}`;
    const driverPort = `--driverPort=${params.driverPort}`;
    const udtServicePort = `--servicePort=${params.servicePort}`;
    const uxpPluginID = `--uxpPluginID=${pluginID}`;

    const pluginTestRunParams: PluginTestRunParams = {
      supportedHostApp,
      driverPort,
      udtServicePort,
      uxpPluginID,
    };
    return pluginTestRunParams;
  }

  timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeTest(params: TestParams, applicableApps: AppEndPoint[], pluginID: string): Promise<boolean> {
    await this.startTestService(applicableApps);
    await this.timeout(1500);
    const pluginTestsPath = path.resolve(this.pluginFolder, this.pluginTestFolder);
    process.chdir(pluginTestsPath);

    const testParams = this.createUXPPluginTestRunParams(params, applicableApps, pluginID);
    return new Promise((resolve, reject) => {
      const cmd = 'yarn';
      const args = ['uxp-plugin-tests', testParams.driverPort, testParams.udtServicePort, testParams.supportedHostApp, testParams.uxpPluginID];
      const options = {
        stdio: 'inherit' as const,
        shell: process.platform === 'win32',
      };
      const testCommand: ChildProcess = spawn(cmd, args, options);
      testCommand.on('error', (err: Error) => {
        reject(err);
        process.exit();
      });

      testCommand.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(true);
        }
        process.exit();
      });
    });
  }

  initWithBundledTest(pluginDir: string, packageName: string): Promise<boolean> {
    const packageJsonFile = `${packageName}/package.json`;
    const templatePackageDir = require.resolve(packageJsonFile);
    const tempalteDir = path.dirname(templatePackageDir);
    const origTestDir = path.resolve(tempalteDir);
    const destTestDir = path.join(pluginDir, this.pluginTestFolder);

    if (!fs.existsSync(destTestDir)) {
      fs.mkdirSync(destTestDir);
    }
    else {
      const unsafeFiles = [
        'package.json',
        'wdio.conf.js',
        'nightwatch.conf.js',
      ];
      const fileNames = fs.readdirSync(destTestDir);
      const conflictingNames = intersection(fileNames, unsafeFiles);
      if (conflictingNames.length) {
        throw new Error(`Conflicting files ${conflictingNames} exists at ${destTestDir}`);
      }
    }
    fs.cpSync(origTestDir, destTestDir, { recursive: true });
    return Promise.resolve(true);
  }

  installTestDependency(): Promise<{ success: boolean }> {
    process.chdir(this.pluginTestFolder);

    return new Promise((resolve, reject) => {
      const command = 'yarn';
      const args = ['install'];
      const options = {
        stdio: 'inherit' as const,
        shell: process.platform === 'win32',
      };
      const installDependency: ChildProcess = spawn(command, args, options);
      installDependency.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
          return;
        }
        resolve({ success: true });
      });
    });
  }
}

export default PluginTestBaseCommand;
