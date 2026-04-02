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

import type { HostConfig, PluginManifest } from '../../types/index.js';
import fs from 'node:fs';

interface ManifestReadResult {
  manifest?: PluginManifest;
}

interface ManifestValidationReport {
  isValid: boolean;
  manifest?: PluginManifest;
  details: string[];
}

class ManifestHelper {
  static validate(manifestPath: string, command: string): PluginManifest {
    const report = ManifestHelper.validateManifest(manifestPath, command);
    if (!report.isValid) {
      throw new Error(report.details.join('\n'));
    }
    return report.manifest!;
  }

  static readManifest(manifestPath: string): ManifestReadResult {
    if (!fs.existsSync(manifestPath)) {
      return {};
    }

    const contents = fs.readFileSync(manifestPath, 'utf8');
    const manifestJson: PluginManifest = JSON.parse(contents);
    return { manifest: manifestJson };
  }

  static validateManifest(manifestPath: string, command: string): ManifestValidationReport {
    if (!fs.existsSync(manifestPath)) {
      const isValid = false;
      const details: string[] = [];
      details.push(`Failed to ${command} plugin because the manifest couldn't be located.`);
      details.push(`Given Manifest path: ${manifestPath}`);
      return {
        isValid,
        details,
      };
    }
    const contents = fs.readFileSync(manifestPath, 'utf8');
    const manifestJson: PluginManifest = JSON.parse(contents);
    const hostArray: HostConfig[] = manifestJson.host
      ? Array.isArray(manifestJson.host)
        ? manifestJson.host
        : [manifestJson.host]
      : [];
    let isValid = false;
    const details: string[] = [];
    if (hostArray.length > 0) {
      const hostAppIds = hostArray.filter((host: HostConfig) => !!host.app).map((host: HostConfig) => host.app);
      if (hostAppIds.length) {
        isValid = true;
      }
      else {
        details.push('Manifest \'host\' should contain atleast one \'app\' entry in it.');
      }
    }
    else {
      details.push('`host` entry is missing in the manifest');
    }

    if (isValid) {
      const idValid = (typeof manifestJson.id == 'string') && manifestJson.id.length > 0;
      if (!idValid) {
        isValid = false;
        details.push('`id` entry is missing or is not valid in the manifest');
      }
    }

    if (isValid) {
      let name = manifestJson.name;
      if (typeof name === 'object') {
        name = (name as { default?: string }).default;
      }
      const isValidName = (typeof name == 'string') && name.length > 0;
      if (!isValidName) {
        details.push('`name` entry is missing or is not valid in the manifest');
      }
      isValid = isValidName;
    }

    const report: ManifestValidationReport = {
      isValid,
      manifest: manifestJson,
      details,
    };
    return report;
  }
}

export default ManifestHelper;
