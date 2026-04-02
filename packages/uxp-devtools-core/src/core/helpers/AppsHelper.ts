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

import type { AppEndPoint, HostConfig, PluginManifest } from '../../types/index.js';
import { filter, find } from 'lodash-es';
import DevToolsError from '../common/DevToolsError.js';

class AppEndPointHelper {
  static fromIdVer(appIdVer: string): AppEndPoint {
    const vals = appIdVer.split('@');
    const id = vals[0];
    if (!id) {
      throw new DevToolsError(
        DevToolsError.ErrorCodes.INVALID_PARAM,
        { appIdVer },
        `Invalid app identifier: "${appIdVer}" - missing app ID`,
      );
    }
    const version = vals.length > 1 ? vals[1] : undefined;
    return {
      id,
      version,
    };
  }

  // this method assumes that we have a valid manifest json.
  static fromManifest(manifest: PluginManifest): AppEndPoint[] {
    const hostArray: HostConfig[] = Array.isArray(manifest.host)
      ? manifest.host
      : manifest.host
        ? [manifest.host]
        : [];
    const hostAppIds = hostArray.map((host: HostConfig) => host.app);
    return hostAppIds.map(AppEndPointHelper.fromIdVer);
  }

  static isSame(base: AppEndPoint, other: AppEndPoint): boolean {
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
  static filterApplicableAppsFromList(
    appsFullList: AppEndPoint[],
    pluginApplicableApps: AppEndPoint[],
  ): AppEndPoint[] {
    const applicableApps = filter(appsFullList, (cep: AppEndPoint) => {
      const obj = find(pluginApplicableApps, (pae: AppEndPoint) =>
        AppEndPointHelper.isSame(pae, cep));
      return !!obj;
    });

    return applicableApps;
  }

  static getApplicableAppsFromInput(
    appsFullList: AppEndPoint[],
    appIdsRawInput: string[],
  ): AppEndPoint[] {
    // find intersection of apps from input and manifest
    const inputAppEndPoints = appIdsRawInput.map(AppEndPointHelper.fromIdVer);
    return AppsHelper.filterApplicableAppsFromList(inputAppEndPoints, appsFullList);
  }

  // get the list of apps which are applicable for this plugin based
  // on combination of supported App id present in manifest json
  // and apps list provided by user as parameter to the command.
  static getApplicableAppsForPlugin(
    manifest: PluginManifest,
    appIdsRawInput: string[],
  ): AppEndPoint[] {
    const manifestAppList = AppEndPointHelper.fromManifest(manifest);
    if (!appIdsRawInput.length) {
      // no input apps so just return all the apps present in the manifest as applicable apps.
      return manifestAppList;
    }
    return AppsHelper.getApplicableAppsFromInput(manifestAppList, appIdsRawInput);
  }

  // filter list the connected apps which are applicable for plugin to load into
  // based on plugins' app applicable list.
  static filterConnectedAppsForPlugin(
    connectedApps: AppEndPoint[],
    pluginApplicableApps: AppEndPoint[],
  ): AppEndPoint[] {
    if (!pluginApplicableApps.length) {
      throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_APPLICABLE_APPS);
    }
    if (!connectedApps.length) {
      throw new DevToolsError(DevToolsError.ErrorCodes.NO_APPS_CONNECTED_TO_SERVICE);
    }

    return AppsHelper.filterApplicableAppsFromList(connectedApps, pluginApplicableApps);
  }
}

export default AppsHelper;
