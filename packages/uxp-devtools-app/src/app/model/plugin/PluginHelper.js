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

import PluginManifest from "./PluginManifest";
import { CoreHelpers } from "@adobe/uxp-devtools-core";


export function readPluginManifest(manifestPath) {
    const report = CoreHelpers.ManifestHelper.validateManifest(manifestPath);
    if (!report.isValid) {
        const details = report.details.join("\n");
        const msg = `Plugin Manifest is Invalid.\n ${details}`;
        throw new Error(msg);
    }
    const manifest = report.manifest;
    const hosts = Array.isArray(manifest.host) ? manifest.host : [ manifest.host ];
    return new PluginManifest(manifest.id, manifest.name, hosts);
}
