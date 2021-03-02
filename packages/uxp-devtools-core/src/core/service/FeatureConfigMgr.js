
/* eslint-disable class-methods-use-this */
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

const hostAppConfig = [
    {
        "appId" : "XD",
        "appVersion" : "36",
        "unSupportedFeatures": [
            {
                "actionName": "reload"
            }
        ]
    },
    {
        "appId" : "XD",
        "appVersion" : "37",
        "unSupportedFeatures": [
            {
                "actionName": "reload"
            }
        ]
    }
];

class FeatureConfig {
    constructor(hostApp) {
        this._hostApp = hostApp;
        this.unSupportedFeatures = [];
        this._initializeConfig(hostApp);
    }

    _initializeConfig(hostApp) {
        for(const configSetting of hostAppConfig) {
            if(configSetting.appId === hostApp.appId && this._isVersionSame(configSetting.appVersion,hostApp.appVersion)) {
                const unsupportedFeatures = configSetting.unSupportedFeatures;
                for(const unsupportedFeature of unsupportedFeatures) {
                    this.unSupportedFeatures.push(unsupportedFeature);
                }
            }
        }
    }

    isReloadSupported() {
        return this._isFeatureSupported("reload");
    }

    _isVersionSame(configHostAppVersion, actualHostVersion) {
        if (configHostAppVersion === actualHostVersion) {
            return true;
        }
        var version1_components = configHostAppVersion.split(".");
        var version2_components = actualHostVersion.split(".");

        for (var i = 0; i < version1_components.length; i++) {
            if (parseInt(version1_components[i]) !== parseInt(version2_components[i])) {
                return false;
            }
        }
        return true;
    }

    _isFeatureSupported(feature) {
        for(const unsupportedFeature of this.unSupportedFeatures) {
            if(unsupportedFeature.actionName === feature) {
                return false;
            }
        }
        return true;
    }
}

let sInstance = null;

class FeatureConfigMgr {

    static instance() {
        if(sInstance != null) {
            return sInstance;
        }
        sInstance = new FeatureConfigMgr();
        return sInstance;
    }


    constructor() {
        this.featureConfigs = new Map();
    }

    getConfigForHostApp(appId, appVersion) {
        const hostApp = {
            appId,
            appVersion
        };

        if(this._checkIfConfigExists(hostApp)) {
            return this._getFeatureConfig(hostApp);
        }
        this._storeFeatureConfig(hostApp);
        return this._getFeatureConfig(hostApp);
    }

    _getFeatureConfig(hostApp) {
        return this.featureConfigs.get(hostApp);
    }

    _storeFeatureConfig(hostApp) {
        const featureConfig = new FeatureConfig(hostApp);
        this.featureConfigs.set(hostApp, featureConfig);
    }

    _checkIfConfigExists(hostApp) {
        if(this.featureConfigs.has(hostApp)) {
            return true;
        }
        return false;
    }
}

module.exports = FeatureConfigMgr;
