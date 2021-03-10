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

const _ = require("lodash");
const DevToolsError = require("../common/DevToolsError");

class AppEndPoint {
    static fromIdVer(appIdVer) {
        const vals = appIdVer.split("@");
        const id = vals[0];
        const version = vals.length > 1 ? vals[1] : undefined;
        return {
            id,
            version,
        };
    }

    // this method assumes that we have a valid manifest json.
    static fromManifest(manifest) {
        let hostArray = manifest.host;
        if (!Array.isArray(hostArray)) {
            hostArray = [ hostArray ];
        }
        const hostAppIds = hostArray.map((host) => host.app);
        return hostAppIds.map(AppEndPoint.fromIdVer);
    }

    static isSame(base, other) {
        if (base.id === other.id) {
            if (base.version && other.version) {
                // both version are present - so compare
                return base.version === other.version;
            }
            return true;
        }
        return false;
    }
}

class AppsHelper {
    static filterApplicableAppsFromList(appsFullList, pluginApplicableApps) {
        const applicableApps = _.filter(appsFullList, (cep) => {
            const obj = _.find(pluginApplicableApps, (pae) => AppEndPoint.isSame(pae, cep));
            return !!obj;
        });

        return applicableApps;
    }

    static getApplicableAppsFromInput(appsFullList, appIdsRawInput) {
        // find intersection of apps from input and manifest
        const inputAppEndPoints = appIdsRawInput.map(AppEndPoint.fromIdVer);
        return AppsHelper.filterApplicableAppsFromList(inputAppEndPoints, appsFullList);
    }

    // get the list of apps which are applicable for this plugin based
    // on combination of supported App id present in manifest json
    // and apps list provided by user as parameter to the command.
    static getApplicableAppsForPlugin(manifest, appIdsRawInput) {
        const manifestAppList = AppEndPoint.fromManifest(manifest);
        if (!appIdsRawInput.length) {
            // no input apps so just return all the apps present in the manifest as applicable apps.
            return manifestAppList;
        }
        return AppsHelper.getApplicableAppsFromInput(manifestAppList, appIdsRawInput);
    }

    // filter list the connected apps which are applicable for plugin to load into
    // based on plugins' app applicable list.
    static filterConnectedAppsForPlugin(connectedApps, pluginApplicableApps) {
        if (!pluginApplicableApps.length) {
            throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_APPLICABLE_APPS);
        }
        if (!connectedApps.length) {
            throw new DevToolsError(DevToolsError.ErrorCodes.NO_APPS_CONNECTED_TO_SERVICE);
        }

        return AppsHelper.filterApplicableAppsFromList(connectedApps, pluginApplicableApps);
    }
}

module.exports = AppsHelper;
