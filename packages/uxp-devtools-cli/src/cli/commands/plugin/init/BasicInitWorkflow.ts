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

import type { PromptObject } from 'prompts';
import fs from 'node:fs';
import path from 'node:path';
import { merge } from 'lodash-es';
import prompts from 'prompts';
import semver from 'semver';
import questions from './BasicInitQuestions.js';
import { initWithBundledPluginTemplate } from './TemplateBasedInitWorkflow.js';

interface HostApp {
  app: string;
  minVersion: string;
}

interface UserInputData {
  host?: HostApp[];
  version?: string;
  name?: string;
  id?: string;
  [key: string]: unknown;
}

interface ManifestJson {
  [key: string]: unknown;
}

interface InitResult {
  success: boolean;
  error?: string | Error;
}

const currentPath: string = process.cwd();
const userInput: UserInputData = {};

function onCancel(): never {
  throw new Error('User Prompt Cancelled');
}

function onSubmit(prompt: PromptObject, answer: unknown): void {
  const propertyName = prompt.name as string;
  const propertyValue = answer;

  if (!propertyValue) {
    return;
  }

  // Create Object for each host app.
  if (propertyName === 'host') {
    const appList: HostApp[] = [];
    (propertyValue as string[]).forEach((element) => {
      const app: HostApp = {
        app: element,
        // needs to be updated once we have more apps
        minVersion: element === 'XD' ? '36.0.0' : '21.0.0',
      };
      appList.push(app);
    });
    userInput.host = appList;
    return;
  }

  // Add host app supported vesrion.
  if (propertyName.includes('version')) {
    // Check for valid Plugin Id.
    if (propertyName === 'version' && semver.valid(propertyValue as string)) {
      userInput[propertyName] = propertyValue as string;
      return;
    }

    const appList = userInput.host;
    if (Array.isArray(appList) && appList.length > 0) {
      for (let i = 0; i < appList.length; i++) {
        const hostApp = appList[i];
        if (!hostApp) {
          throw new Error(`Host app at index ${i} is undefined`);
        }
        const appVersion = `${hostApp.app.toString().toLowerCase()}version`;
        if (propertyName === appVersion && semver.valid(propertyValue as string)) {
          hostApp.minVersion = answer as string;
        }
      }
    }
    return;
  }

  userInput[propertyName] = propertyValue;
}

class PluginInitBasic {
  private _data: ManifestJson = {};
  private _manifestJson: ManifestJson = {};

  private _saveManifest(): { success: boolean } {
    const filePath = path.resolve(currentPath, 'manifest.json');
    fs.writeFileSync(filePath, JSON.stringify(this._data, null, 2), 'utf8');
    return {
      success: true,
    };
  }

  private _ensureMasterJson(): void {
    const manifestPath = path.join(currentPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      // Read and parse manifest JSON
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      this._manifestJson = JSON.parse(manifestContent) as ManifestJson;
      return;
    }
    this._manifestJson = {};
  }

  private _getDefaultTemplate(): string {
    const defaultPrefix = 'default-starter';
    let host = userInput.host;
    if (!Array.isArray(host)) {
      host = host ? [host] : [];
    }
    let defaultTemplate = defaultPrefix;
    if (host && host.length > 0) {
      const firstHost = host[0];
      if (!firstHost) {
        throw new Error('Host array is non-empty but first element is undefined');
      }
      defaultTemplate = (host.length > 1) ? defaultPrefix : `${defaultPrefix}-${firstHost.app.toLowerCase()}`;
    }
    return defaultTemplate;
  }

  private _executeBasicInit(): Promise<boolean> {
    const manifestProm = prompts(questions, { onSubmit, onCancel });

    return manifestProm.then(() => {
      const template = this._getDefaultTemplate();
      const result: InitResult = initWithBundledPluginTemplate(currentPath, template);
      if (!result.success) {
        return Promise.reject(result.error);
      }
      this._ensureMasterJson();
      this._data = merge(this._manifestJson, userInput);
      this._saveManifest();
      return Promise.resolve(true);
    });
  }

  execute(): Promise<boolean> {
    return this._executeBasicInit();
  }
}

export default PluginInitBasic;
