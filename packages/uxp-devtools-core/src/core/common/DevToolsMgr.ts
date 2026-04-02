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

import DevToolsHelper from '@adobe-fixed-uxp/uxp-devtools-helper';

export interface DevToolsCommandOptions {
  controlled?: boolean;
  scriptsFolder?: string;
  port?: number;
}

export interface HelperAppInfo {
  appId: string;
  appVersion: string;
  name: string;
}

class DevToolsMgr {
  private _devToolsHelper: DevToolsHelper;

  constructor(isServer: boolean) {
    this._devToolsHelper = new DevToolsHelper(isServer);
  }

  setServerDetails(port: number): void {
    this._devToolsHelper.setServerDetails(port);
  }

  getAppsList(): Promise<HelperAppInfo[]> {
    return Promise.resolve(this._devToolsHelper.getAppsList());
  }

  disableDevTools(options?: DevToolsCommandOptions): Promise<boolean> {
    return DevToolsHelper.disableDevTools(options);
  }

  enableDevTools(options?: DevToolsCommandOptions): Promise<boolean> {
    return DevToolsHelper.enableDevTools(options);
  }

  isDevToolsEnabled(): Promise<boolean> {
    return DevToolsHelper.isDevToolsEnabled();
  }

  discoverServicePort(): Promise<number> {
    return this._devToolsHelper.getServicePort();
  }

  terminate(): void {
    this._devToolsHelper.terminate();
  }
}

export default DevToolsMgr;
