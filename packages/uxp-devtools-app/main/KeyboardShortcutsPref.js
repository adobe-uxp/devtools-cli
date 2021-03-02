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

const keyboardShortcuts = {
    "createPlugin" : {
        "default": "Ctrl+N",
        "darwin": "Cmd+N"
    },
    "addPlugin": {
        "default": "Ctrl+O",
        "darwin": "Cmd+O"
    },
    "removeSelectedPlugins": {
        "default": "Ctrl+Delete",
        "darwin": "Cmd+Backspace"
    },
    "loadSelected": {
        "default": "Ctrl+L",
        "darwin": "Cmd+L"
    },
    "unloadSelected": {
        "default": "Shift+Ctrl+L",
        "darwin": "Shift+Cmd+L"
    },
    "reloadSelected": {
        "default": "Alt+Ctrl+R",
        "darwin": "Option+Cmd+R"
    },
    "reloadAll": {
        "default": "Shift+Ctrl+R",
        "darwin": "Shift+Cmd+R"
    },
    "watchSelected": {
        "default": "Alt+Ctrl+W",
        "darwin": "Option+Cmd+W"
    },
    "unwatchSelected": {
        "default": "Shift+Ctrl+W",
        "darwin": "Shift+Cmd+W"
    },
    "debugSelected": {
        "default": "Ctrl+D",
        "darwin": "Cmd+D"
    }
};

Object.keys(keyboardShortcuts).map((key) => {
    const platform = process.platform === "darwin" ? "darwin" : "default";
    keyboardShortcuts[key] = keyboardShortcuts[key][platform];
});

module.exports = keyboardShortcuts;
