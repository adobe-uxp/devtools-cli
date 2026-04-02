/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

interface UnsupportedFeature {
  actionName: string;
}

interface HostAppConfigEntry {
  appId: string;
  appVersion: string;
  unSupportedFeatures: UnsupportedFeature[];
}

interface HostApp {
  appId: string;
  appVersion: string;
}

const hostAppConfig: HostAppConfigEntry[] = [
  {
    appId: 'XD',
    appVersion: '36',
    unSupportedFeatures: [
      {
        actionName: 'reload',
      },
    ],
  },
  {
    appId: 'XD',
    appVersion: '37',
    unSupportedFeatures: [
      {
        actionName: 'reload',
      },
    ],
  },
];

class FeatureConfig {
  private _hostApp: HostApp;
  public unSupportedFeatures: UnsupportedFeature[];

  constructor(hostApp: HostApp) {
    this._hostApp = hostApp;
    this.unSupportedFeatures = [];
    this._initializeConfig(hostApp);
  }

  private _initializeConfig(hostApp: HostApp): void {
    for (const configSetting of hostAppConfig) {
      if (configSetting.appId === hostApp.appId && this._isVersionSame(configSetting.appVersion, hostApp.appVersion)) {
        const unsupportedFeatures = configSetting.unSupportedFeatures;
        for (const unsupportedFeature of unsupportedFeatures) {
          this.unSupportedFeatures.push(unsupportedFeature);
        }
      }
    }
  }

  isReloadSupported(): boolean {
    return this._isFeatureSupported('reload');
  }

  private _isVersionSame(configHostAppVersion: string, actualHostVersion: string): boolean {
    if (configHostAppVersion === actualHostVersion) {
      return true;
    }
    const version1_components = configHostAppVersion.split('.');
    const version2_components = actualHostVersion.split('.');

    for (let i = 0; i < version1_components.length; i++) {
      const v1Component = version1_components[i];
      const v2Component = version2_components[i];
      if (v1Component === undefined || v2Component === undefined) {
        return false;
      }
      if (Number.parseInt(v1Component) !== Number.parseInt(v2Component)) {
        return false;
      }
    }
    return true;
  }

  private _isFeatureSupported(feature: string): boolean {
    for (const unsupportedFeature of this.unSupportedFeatures) {
      if (unsupportedFeature.actionName === feature) {
        return false;
      }
    }
    return true;
  }
}

let sInstance: FeatureConfigMgr | null = null;

class FeatureConfigMgr {
  private featureConfigs: Map<HostApp, FeatureConfig>;

  static instance(): FeatureConfigMgr {
    if (sInstance != null) {
      return sInstance;
    }
    sInstance = new FeatureConfigMgr();
    return sInstance;
  }

  constructor() {
    this.featureConfigs = new Map();
  }

  getConfigForHostApp(appId: string, appVersion: string): FeatureConfig {
    if (!appId) {
      throw new Error('appId is required for getConfigForHostApp');
    }
    if (!appVersion) {
      throw new Error('appVersion is required for getConfigForHostApp');
    }
    const hostApp: HostApp = {
      appId,
      appVersion,
    };

    if (this._checkIfConfigExists(hostApp)) {
      const config = this._getFeatureConfig(hostApp);
      if (!config) {
        throw new Error(`FeatureConfig unexpectedly missing for hostApp: ${appId}@${appVersion}`);
      }
      return config;
    }
    this._storeFeatureConfig(hostApp);
    const config = this._getFeatureConfig(hostApp);
    if (!config) {
      throw new Error(`Failed to create FeatureConfig for hostApp: ${appId}@${appVersion}`);
    }
    return config;
  }

  private _getFeatureConfig(hostApp: HostApp): FeatureConfig | undefined {
    return this.featureConfigs.get(hostApp);
  }

  private _storeFeatureConfig(hostApp: HostApp): void {
    const featureConfig = new FeatureConfig(hostApp);
    this.featureConfigs.set(hostApp, featureConfig);
  }

  private _checkIfConfigExists(hostApp: HostApp): boolean {
    if (this.featureConfigs.has(hostApp)) {
      return true;
    }
    return false;
  }
}

export default FeatureConfigMgr;
