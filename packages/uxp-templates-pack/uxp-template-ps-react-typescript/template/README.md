# react-typescript-plugin

Quick starter for writing UXP plugins using React, Typescript and Webpack.

## Setup

First, make sure you update three things:

 1 In uxp/manifest.json, change `name` and `ID` for your own plugin
 
 2 In uxp/manifest.json, change `entryPoints > label` for what you want your plugin to show as under the Photoshop Plugins menu
 
 3 In uxp/debug.json, change `port` to a value that you're sure other plugins don't use

Install the dependencies:

```
yarn install
```

Run webpack to bundle

```
yarn build
# or "yarn watch" to watch for file changes and rebuild automatically
```

Now, you can load your plugin using [UXP DevTools](https://github.com/adobe-uxp/devtools-cli), please follow the instructions there.

## (PreRelease) Prerequisites

While we're still developing UXP, we want to make sure these features are behind flags so they don't affect end users. To enable UXP development and see your panels in Photoshop, you will need to set a checkbox in preferences.

In Preferences > Technology Previews, please find `ScriptDeveloper` under the Prerelease Features table, and enable it. And then restart Photoshop to start loading your plugin.

## Panel Entrypoints

The ui entrypoint of a UXP plugin as a panel is defined in it's `manifest.json` file. This is subject to change, so please refer to latest copy of the starter repository as above.

The plugin will be available in Plugins menu with it's name. This will open up a PS panel with your plugin loaded in it.

### Panel Flyout Menus

The plugin's `manifest.json` file allows for the static definition of panel menu items. A flat list of items are supported under `entryPoints` as such:

```
"commands" : [
    {"title": {"default": "Command 1"}, "command": "flyoutMenuCommand1"},
    {"title": {"default": "Command 2"}, "command": "flyoutMenuCommand2"},
]
```

Ensure that the invoked command or function is available globally.

## Debugging

Please use devtools to debug your plugin with the stand alone debugger.