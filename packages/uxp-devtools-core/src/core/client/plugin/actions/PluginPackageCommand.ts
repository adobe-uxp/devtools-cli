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

import type { Archiver } from 'archiver';
import type { HostConfig, PluginManifest } from '../../../../types/plugins.js';
import type PluginMgr from '../../PluginMgr.js';
import type { CommandParams } from './PluginBaseCommand.js';
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import ignoreWalk from 'ignore-walk';
import PluginBaseCommand from './PluginBaseCommand.js';

export interface PackageParams extends CommandParams {
  manifest?: string;
  apps?: string[];
  packageDir?: string;
}

interface PackageResult {
  success: boolean;
  host?: string;
  error?: Error;
}

interface ManifestWithSingleHost extends PluginManifest {
  host: HostConfig;
}

interface ManifestEntryPoint {
  type: string;
  icons?: unknown[];
  [key: string]: unknown;
}

const validationSupportedApps = ['PS', 'XD'];
const numbersRegex = /^\d+$/;
const versionRegex = /^\d+(\.\d+){0,3}$/;

const PLUGIN_VERSION_LENGTH = 3;
const MANIFEST_VERSION_4 = 4;

class PluginPackageCommand extends PluginBaseCommand {
  protected override params: PackageParams;

  constructor(pluginMgr: PluginMgr, params?: PackageParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  validateIcons(manifest: PluginManifest): void {
    if (!Array.isArray(manifest.icons)) {
      throw new TypeError('Plugin icons are not specified in the manifest.');
    }

    let manifestEntryPoints = manifest.entrypoints as ManifestEntryPoint | ManifestEntryPoint[] | undefined;
    if (!manifestEntryPoints) {
      return;
    }
    manifestEntryPoints = Array.isArray(manifestEntryPoints) ? manifestEntryPoints : [manifestEntryPoints];
    for (const entryPoint of manifestEntryPoints) {
      if (entryPoint.type === 'panel' && !Array.isArray(entryPoint.icons)) {
        throw new Error('Icons are not specified for panel entrypoints in the manifest.');
      }
    }
  }

  validatePluginNameFormat(manifest: PluginManifest): void {
    if (!(manifest.name && manifest.name.length >= 3 && manifest.name.length <= 45)) {
      throw new Error(`Malformed manifest: Plugin name must be between 3 and 45 characters long.`);
    }
  }

  validatePluginVersionFormat(manifest: PluginManifest): void {
    const pluginVersionParts = manifest.version!.split('.');
    if (pluginVersionParts.length !== PLUGIN_VERSION_LENGTH) {
      throw new Error(`Malformed manifest: "version" is incorrectly formatted. Expected "x.y.z" form.`);
    }
  }

  validateHostMinVersion(host: HostConfig, expectedVersion: number): void {
    if (!host.minVersion) {
      throw new Error('Malformed manifest: `minVersion` is not provided.');
    }
    const minVersionParts = !host.minVersion.toString().includes('.') ? [host.minVersion] : host.minVersion.toString().split('.');
    if (!host.minVersion.toString().match(versionRegex)) {
      throw new Error('Malformed manifest: `minVersion` is incorrectly formatted. Expected `x.y.z` form.');
    }
    const parsedHostVersion = Number.parseInt(minVersionParts[0] as string);
    if (Number.isNaN(parsedHostVersion) || parsedHostVersion < expectedVersion) {
      throw new Error(`Failed to package plugin: packaging only supports ${host.app} \`minVersion\` of '${expectedVersion}' or higher`);
    }
  }

  validateManifestForPS(manifest: PluginManifest, host: HostConfig): void {
    if (!manifest.version) {
      throw new Error('Malformed manifest: missing `version`.');
    }
    if (!manifest.manifestVersion) {
      throw new Error('Malformed manifest: `manifestVersion` is not provided.');
    }
    if (!(manifest.manifestVersion as unknown as string).toString().match(numbersRegex)) {
      throw new Error('Malformed manifest: `manifestVersion` is incorrectly formatted; it should be an integer and be 4 or higher.');
    }
    const parsedManifestVersion = Number.parseInt((manifest.manifestVersion as unknown as string).toString());
    if (Number.isNaN(parsedManifestVersion) || parsedManifestVersion < MANIFEST_VERSION_4) {
      throw new Error('Failed to package plugin: `manifestVersion` must be 4 or higher.');
    }

    this.validateHostMinVersion(host, 22);
  }

  validateForXD(manifest: PluginManifest, host: HostConfig): void {
    this.validatePluginNameFormat(manifest);

    const manifestVersion = manifest.manifestVersion as unknown as number | undefined;
    if (!manifestVersion || manifestVersion <= 3) {
      this.validateHostMinVersion(host, 13);
    }
    else {
      if (!(manifestVersion as unknown as string).toString().match(numbersRegex)) {
        throw new Error('Malformed manifest: `manifestVersion` is incorrectly formatted; it should be an integer and be 4 or higher.');
      }
      const parsedManifestVersion = Number.parseInt((manifestVersion as unknown as string).toString());
      if (Number.isNaN(parsedManifestVersion) || parsedManifestVersion < MANIFEST_VERSION_4) {
        throw new Error('Failed to package plugin: `manifestVersion` must be 4 or higher.');
      }
      this.validateHostMinVersion(host, 37);
    }
  }

  validateForPackaging(manifest: PluginManifest, packagingHost: HostConfig): void {
    if (validationSupportedApps.includes(packagingHost.app)) {
      // Validation will be done only for validationSupportedApps
      this.validatePluginVersionFormat(manifest);
      if (packagingHost.app === 'PS') {
        this.validateManifestForPS(manifest, packagingHost);
        this.validateIcons(manifest);
      }
      else if (packagingHost.app === 'XD') {
        this.validateForXD(manifest, packagingHost);
      }
    }
  }

  getManifestsForPackaging(manifestJson: PluginManifest, appsList: string[]): ManifestWithSingleHost[] {
    const resultManifestJsons: ManifestWithSingleHost[] = [];
    let hosts = manifestJson.host;

    if (!Array.isArray(hosts)) {
      hosts = hosts ? [hosts] : [];
    }

    let selectedHost = hosts;
    if (appsList.length) {
      selectedHost = hosts.filter(host => appsList.includes(host.app));
    }

    for (const host of selectedHost) {
      const manifest = JSON.parse(JSON.stringify(manifestJson)) as ManifestWithSingleHost;
      manifest.host = host;
      resultManifestJsons.push(manifest);
    }

    return resultManifestJsons;
  }

  getFilesForPackaging(sourcePath: string): string[] {
    let files = ignoreWalk.sync({
      path: sourcePath,
      ignoreFiles: ['.gitignore', '.npmignore'],
      includeEmpty: false,
    });

    const ignoredFiles = ['.uxprc', '.gitignore', 'yarn.lock', '.npmignore', '.DS_Store', 'manifest.json', 'package-lock.json'];
    files = files.filter((file: string) => {
      const fileName = file.substr(file.lastIndexOf('/') + 1);
      return !(ignoredFiles.includes(fileName) || fileName.startsWith('.'));
    });

    files = files.filter((file: string) => {
      return !(file.endsWith('.ccx') || file.endsWith('.xdx') || file.startsWith('uxp-plugin-tests'));
    });

    return files;
  }

  packageHost(manifestJson: ManifestWithSingleHost): Promise<PackageResult> {
    const prom = new Promise<PackageResult>((resolve) => {
      const sourcePath = path.dirname(this.params.manifest!);
      const files = this.getFilesForPackaging(sourcePath);
      try {
        this.validateForPackaging(manifestJson, manifestJson.host);
      }
      catch (err) {
        return resolve({
          success: false,
          error: new Error(`Validation failed for ${manifestJson.host.app} with ${err}`),
        });
      }
      const extension = manifestJson.host.app === 'XD' ? '.xdx' : '.ccx';
      const zipFileName = `${manifestJson.id}_${manifestJson.host.app}${extension}`;
      const zipFile = path.resolve(this.params.packageDir!, zipFileName);
      const archive: Archiver = archiver('zip', {
        zlib: { level: 9 },
      });
      const outputStream = fs.createWriteStream(zipFile);
      archive.append(JSON.stringify(manifestJson, null, 2), { name: 'manifest.json' });
      files.forEach((file) => {
        archive.append(fs.createReadStream(path.join(sourcePath, file)), { name: file });
      });
      outputStream.on('close', () => {
        return resolve({
          success: true,
          host: manifestJson.host.app,
        });
      });
      outputStream.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EACCES' || err.code === 'EPERM') {
          return resolve({
            success: false,
            error: new Error(`Failed to package plugin for ${manifestJson.host.app} : Could not write to the target folder (no permission).`),
          });
        }
        return resolve({
          success: false,
          error: err,
        });
      });
      archive.pipe(outputStream);
      archive.finalize();
    });
    return prom;
  }

  package(): Promise<PackageResult[]> {
    const packagePromises: Promise<PackageResult>[] = [];
    const manifestJson = JSON.parse(fs.readFileSync(this.params.manifest!, 'utf-8')) as PluginManifest;
    const appsList = this.params.apps || [];
    const manifestsJson = this.getManifestsForPackaging(manifestJson, appsList);
    for (const manifest of manifestsJson) {
      packagePromises.push(this.packageHost(manifest));
    }
    return Promise.all(packagePromises);
  }

  getFailCount(results: PackageResult[]): number {
    let failCount = 0;
    for (const result of results) {
      if (!result.success) {
        UxpLogger.error(result.error!.message);
        ++failCount;
      }
      else {
        UxpLogger.log(`Successfully packaged plugin for ${result.host}`);
      }
    }
    return failCount;
  }

  consolidateResult(failCount: number, total: number): string {
    if (failCount === total) {
      throw new Error('Failed to package plugin.');
    }
    else if (failCount === 0) {
      UxpLogger.log(`Package written to ${this.params.packageDir}`);
      return 'Successfully packaged plugin.';
    }
    else {
      UxpLogger.log(`Package written to ${this.params.packageDir}`);
      return `Packaging succeeded for ${total - failCount} host(s), but failed for ${failCount} host(s).`;
    }
  }

  override execute(): Promise<string> {
    const prom = this.pm.validatePluginManifest(this.params);
    return prom.then(() => {
      const packageProm = this.package();
      return packageProm.then((results) => {
        const failCount = this.getFailCount(results);
        return this.consolidateResult(failCount, results.length);
      });
    }).catch((err: { code?: number }) => {
      if (err.code === 8 || err.code === 4 || err.code === 9) {
        UxpLogger.warn(`Warning: Skipping strict manifest validation as no compatible host applications are connected to the UXP Service. Strict validation of the manifest currently requires the host application to be running.`);
        const packageProm = this.package();
        return packageProm.then((results) => {
          const failCount = this.getFailCount(results);
          return this.consolidateResult(failCount, results.length);
        });
      }
      throw new Error(`Packaging failed : ${err}`);
    });
  }
}

export default PluginPackageCommand;
