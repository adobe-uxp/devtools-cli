/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import type { AppInfo, DeferredPromise, DevToolsCommandOptions, PortListener, VulcanAdapter } from './types.js';
import DevToolNativeLib from './DevToolNativeLib.js';
import { devToolsCommandRunner, isDevToolsEnabled } from './DevToolsUtils.js';

// Note: not including "XD" for now - alpha release.
const kSupportedUxpHostAppsIds = [
  'PS',
  'UXPS',
];

class DevToolHelperNative {
  private _nativeAdapter: VulcanAdapter | null;
  private _portListeners: PortListener[];
  private _servicePortCallback: ((type: string, payload: string, appId: string, appVersion: string) => void) | null = null;

  constructor(seldEndPointId: string, seldEndPointVersion: string) {
    this._nativeAdapter = new DevToolNativeLib.VulcanAdapter(seldEndPointId, seldEndPointVersion);
    this._portListeners = [];
  }

  getAppsList(): string[] {
    if (!this._nativeAdapter)
      return [];
    const appsList = this._nativeAdapter.getAppsList();
    return appsList;
  }

  setServerDetails(isStarted: boolean, port: number): void {
    if (!this._nativeAdapter)
      return;
    const payload = {
      port,
    };
    this._nativeAdapter.setServerDetails(isStarted, JSON.stringify(payload));
  }

  private _handlePortDetails(type: string, payload: string, appId: string, appVersion: string): void {
    for (const listener of this._portListeners) {
      listener(type, {
        payload,
        appId,
        appVersion,
      });
    }
  }

  terminate(): void {
    if (this._servicePortCallback && this._nativeAdapter) {
      this._nativeAdapter.disconnect();
    }
    this._nativeAdapter = null;
  }

  getServicePort(portListener: PortListener): void {
    this._portListeners.push(portListener);

    if (!this._servicePortCallback && this._nativeAdapter) {
      this._servicePortCallback = this._handlePortDetails.bind(this);
      this._nativeAdapter.getServicePort(this._servicePortCallback);
    }
  }
}

const kUDTServerAppId = 'UTDS';
const kUDTClientAppId = 'UTDC';

class DevToolsHelper {
  private _devToolsNative: DevToolHelperNative | null;

  constructor(isServer: boolean) {
    const kVersion = '1.0.0';
    const appId = isServer ? kUDTServerAppId : kUDTClientAppId;
    this._devToolsNative = new DevToolHelperNative(appId, kVersion);
  }

  getAppsList(): AppInfo[] {
    if (!this._devToolsNative)
      return [];
    const rawAppsList = this._devToolsNative.getAppsList();
    const appsList = rawAppsList.map((raw) => {
      const data = raw.split(',');
      return {
        appId: data[0] ?? '',
        appVersion: data[1] ?? '',
        name: data[2] ?? '',
      };
    });

    const supportedAppsList = appsList.filter((app) => {
      return kSupportedUxpHostAppsIds.includes(app.appId);
    });
    return supportedAppsList;
  }

  setServerDetails(port: number): void {
    if (!this._devToolsNative)
      return;
    this._devToolsNative.setServerDetails(true, port);
  }

  getServicePort(): Promise<number> {
    const prom = Promise.withResolvers<number>() as DeferredPromise<number>;
    let timeout: ReturnType<typeof setTimeout> | null;
    const errorMsg = 'Cound not connect to the UXP Developer Service. Start the cli service and try again.';

    if (!this._devToolsNative) {
      return Promise.reject(new Error(errorMsg));
    }

    this._devToolsNative.getServicePort((type, data) => {
      try {
        const payload = JSON.parse(data.payload) as { port: number };
        prom.resolve(payload.port);
      }
      catch (err) {
        console.error(err);
        prom.reject(new Error(errorMsg));
      }
      prom.handled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    });

    timeout = setTimeout(() => {
      if (!prom.handled) {
        // we will time out here. Service hasn't replied. Mostly it is not running.
        prom.reject(new Error(errorMsg));
      }
      timeout = null;
    }, 5000);

    return prom.promise;
  }

  // crajTODO - all devTools enabling commands will be worked out after integrating the
  // the native NodeJS lib.
  static disableDevTools(options?: DevToolsCommandOptions): Promise<boolean> {
    return devToolsCommandRunner(false, options);
  }

  static enableDevTools(options?: DevToolsCommandOptions): Promise<boolean> {
    return devToolsCommandRunner(true, options);
  }

  static isDevToolsEnabled(): Promise<boolean> {
    return isDevToolsEnabled();
  }

  terminate(): void {
    if (this._devToolsNative) {
      this._devToolsNative.terminate();
      this._devToolsNative = null;
    }
  }
}

export default DevToolsHelper;
