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
const semver = require("semver");
const pluginName = {
    type: "text",
    name: "name",
    message: "Plugin Name",
    validate: (value) => (!!value),
};

const pluginVersion = {
    type: "text",
    name: "version",
    message: "Plugin Version",
};

const pluginId = {
    type: "text",
    name: "id",
    message: "Plugin Id ?",
    validate: (value) => (!!value),
};

const host = {
    type: "multiselect",
    name: "host",
    message: "Host Application?",
    choices: [
        { title: "Photoshop", value: "PS" },
        { title: "Adobe XD", value: "XD" },
    ],
    min: 1,
};


const psVersion = {
    type: (prev, values) => {
        const appList = values.host;
        if (Array.isArray(appList) && appList.includes("PS")) {
            return "text";
        }
        return null;
    },
    name: "psversion",
    message: "PhotoShop Version",
    validate: value => (semver.valid(value)) ? true : `Please specify valid minVersion in x.y.z format`
};

const xdVersion = {
    type: (prev, values) => {
        const appList = values.host;
        if (Array.isArray(appList) && appList.includes("XD")) {
            return "text";
        }
        return null;
    },
    name: "xdversion",
    message: "Adobe XD Version",
    validate: (value) => (semver.valid(value)) ? true : `Please specify valid minVersion in x.y.z format`
};


const questions = [
    pluginName,
    pluginVersion,
    pluginId,
    host,
    psVersion,
    xdVersion,
];

module.exports = questions;
