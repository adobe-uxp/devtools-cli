**Table of contents**
<!-- npx markdown-toc README.md --maxdepth 3  -->

- [Overview](#overview)
- [Getting started](#getting-started)
    * [Software requirements](#software-requirements)
    * [Installation](#installation)
        + [Manual installation](#manual-installation)
        + [Installation via package manager (work in progress)](#installation-via-package-manager-work-in-progress)
    * [Quick start guide](#quick-start-guide)
    * [Help commands](#help-commands)
- [Commands](#commands)
    * [`apps`](#apps)
    * [`enable`](#enable)
    * [`service`](#service)
    * [`plugin`](#plugin)
        + [Plugin initialization](#plugin-initialization)
        + [Loading a plugin into one or more host apps](#loading-a-plugin-into-one-or-more-host-apps)
        + [Reloading a plugin](#reloading-a-plugin)
        + [Debugging a plugin](#debugging-a-plugin)
        + [Plugin logs](#plugin-logs)
- [Contributing](#contributing)
- [Licensing](#licensing)

# Getting started

## Software requirements

- Yarn version >= 1.5
- Node version >= 10.16
- Git

(Devtools helper uses N-API v4. Node version and N-API compatibility matrix is available [here](https://nodejs.org/api/n-api.html#n_api_n_api_version_matrix).)

## Installation

### Manual installation

- Note that on Windows you need to run these commands in `PowerShell` or `Command Prompt`.

#### Yarn setup

Install `yarn` via `npm` on the command line:

    npm install -g yarn

You need to add the `yarn global bin` path to the `PATH` environment variable to access the `uxp` command directly from the command line. See just below for instructions for your OS.

**Mac**

You can run this command on terminal to add `yarn global bin` to the `PATH`.

    export PATH="$(yarn global bin):$PATH"

**Windows**

You can add yarn global bin path to system variables by following the steps given [here](<https://docs.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ee537574(v%3Doffice.14)>).

**Mac Apple Silicon**

Currently, arm package for electron is not available. Hence ,installation is not supported for node installed for Apple silicon(`arm`)
(Check node processor using `node -p "process.arch"`)
Note: Installation will work on node running in Intel emulation mode (`x64`).

#### Repo setup

- Either clone this repository to your local machine or download and extract the zip
- `cd` into the resulting `uxp-developer-tools` directory
- Run `yarn install`

### Installation via package manager (work in progress)

    npm install @adobe/uxp-devtools-cli

or

    yarn add @adobe/uxp-devtools-cli

## Quick start guide

First, make sure the target application is running.

Then you can start working with the UXP CLI. Be sure you are `cd`'d into your plugin project. (If you don't have a plugin project yet, check out the [Plugin initiatialization](#plugininitialization) section for how to boostrap a plugin from the command line.)

Here is one quick way to get started, which will result in 3 tabs (or command line instances) in your terminal:

1. Tab 1: `uxp service start`
2. Tab 2: `uxp devtools enable && uxp plugin load && uxp plugin debug`
3. Tab 3: Choose your own adventure

For tab 3, here are some options:

- Manually run `uxp plugin reload` when you want to reload changes
- For auto-reload, run `npx nodemon --exec "uxp plugin reload" -e js,jsx,html` [Note: if you have nodemon globally installed, you can omit `npx` from this command]

## Help commands

To get help on the command line, you can run the following commands:

    $ uxp help
    // prints details of all the commands available in the cli.

    $ uxp <command> help
    // prints details of specific command.

# Commands

## `apps`

Get details for apps that support UXP:

    $ uxp apps list

Output:

    ┌─────────┬──────┬──────────┬───────────────────┐
    │ (index) │  ID  │ Version  │       Name        │
    ├─────────┼──────┼──────────┼───────────────────┤
    │    0    │ 'PS' │ '21.0.3' │ 'Adobe Photoshop' │
    ├─────────┼──────┼──────────┼───────────────────┤
    │    1    │ 'XD' │ '28.0.12'│ 'Adobe XD'        │
    └─────────┴──────┴──────────┴───────────────────┘

The ID column contains the app ID that you will use in other CLI commands. This ID string is the same as the app ID you will specify in the plugin's `manifest.json` file under _host -> app_.

If you have more than one version of the same app installed (say, standard & pre-release version), each version will be listed in the output with its own version number. Example:

    ┌─────────┬──────┬──────────┬───────────────────┐
    │ (index) │  ID  │ Version  │       Name        │
    ├─────────┼──────┼──────────┼───────────────────┤
    │    0    │ 'PS' │ '21.0.3' │ 'Adobe Photoshop' │
    ├─────────┼──────┼──────────┼───────────────────┤
    │    1    │ 'PS' │ '21.1.0' │ 'Adobe Photoshop' │ <- this is pre-release.
    ├─────────┼──────┼──────────┼───────────────────┤
    │    2    │ 'XD' │ '28.0.12'│ 'Adobe XD'        │
    └─────────┴──────┴──────────┴───────────────────┘

## `enable`

Before you run any UXP developer commands to load or debug your plugin, you must enable UXP DevTools. To do that, run the following command:

    uxp devtools enable

**Note**: This command will prompt you with an OS credentials dialog. This is done so that random external scripts can't issue plugin load commands to the apps to load unauthorized plugins without user knowledge.

Once you are done with the tooling you can disable UXP DevTools by running the following command:

    $ uxp devtools disable

## `service`

The UXP CLI and Adobe apps communicate with each other using a WebSocket connection. For this to happen, you must start the CLI service from the command line. This runs a server at an optionally specified port.

Start the service:

      $ uxp service start [--port <port>]

     Options:
    --port:  The port is  where the service will run, defaults to 14001

As seen in the Quick Start above, now that the CLI service is running, you need to open a separate command line instance to run the actual developer tool commands.

You can use the new terminal instance to run other project commands for loading/reloading plugins, debugging, and more.

## `plugin`

### Plugin initialization

You can initialize or bootstrap a directory as a UXP plugin by running these commands:

    $ uxp plugin init
    
      - On prompt provide plugin details such as plugin name, plugin version, id
      - Select host app (based on host app, default template for corresponding host app will be selected)
      - If both host apps are selected(XD,PS), common template for host apps is selected
    
    On initialisation, plugin directory structure is created in current working directory which comprises of manifest.json and plugin src files
    
 User template:
 
    $ uxp plugin init [--template <template-source>]

    --template: The template source for the plugin. If a template is not provided, the CLI will prompt you to enter plugin details.
    A template can be one of:
      - the default template provided with the CLI called 'ps-starter'
      - a local path relative to the current working directory (e.g. ../my-custom-template)

### Loading a plugin into one or more host apps

You can load a plugin into a host app like this:

    $ uxp plugin load [--manifest <path>] [--apps <appId ...>] [--breakOnStart]

#### Options

**--manifest**

The path to the plugin's manifest.json file. If the final plugin code is generated in a sub-folder (say, a "build" or "dist" folder), then you need to provide the path to this folder.

**--apps**
A list of apps that you want to load the plugin into. If you don't provide this argument the CLI will look into the host entry details in your `manifest.json` file and load the plugin into all supported apps that are currently connected to the CLI service.

If more than one version of the app is running, you can limit this app to a specific version by appending the version string to the app ID. Let's look at an example:

    $ uxp apps list

    ┌─────────┬──────┬──────────┬───────────────────┐
    │ (index) │  ID  │ Version  │       Name        │
    ├─────────┼──────┼──────────┼───────────────────┤
    │    0    │ 'PS' │ '21.0.3' │ 'Adobe Photoshop' │
    ├─────────┼──────┼──────────┼───────────────────┤
    │    1    │ 'PS' │ '21.1.0' │ 'Adobe Photoshop' │
    └─────────┴──────┴──────────┴───────────────────┘

Load the plugin into both versions of Photoshop:

    $ uxp plugin load

Limit the load to only one version:

    $ uxp plugin load --apps PS@21.1.0

**--breakOnStart**
Blocks the plugin until a debugger attaches.If specified, attach is assumed, and a debugger will immediately be spawned.Defaults to false.


### Reloading a plugin

_After you have loaded your plugin once with `uxp plugin load`_, you can reload the plugin into the host application using this command:

    $ uxp plugin reload [--apps <appId ...>]

#### Options

**--apps**
A list of apps that you want to reload the plugin into. If you don't provide this argument, the CLI will look into the host entry details in your `manifest.json` file and reload the plugin into all supported apps that are currently connected to the CLI service.

If more than one version of the app is running, you can limit this app to a specific version by appending the version string to the app ID.

For eg, to limit the reload to only one version:

    $ uxp plugin unload --apps PS@21.1.0

**Note:** This will reload all changes done in the plugin **except for manifest changes**. To reload your manifest, you will need to run `uxp plugin load`.

### Debugging a plugin

_After you have loaded your plugin once with `uxp plugin load`_, you can debug the plugin using this command:

    $ uxp plugin debug [--apps <appId ...>]

#### Options

**--apps**
If your plugin is loaded in multiple apps, you can use this option to choose the app in which you want to limit the debugging to. 
By default you will able to debug all connected apps specified in your `manifest.json`.

    
### Unloading a plugin from one or more host apps

You can unload a plugin from a host app like this:

    $ uxp plugin unload [--apps <appId ...>]

#### Options

**--apps**
A list of apps that you want to unload the plugin from. If you don't provide this argument, the CLI will look into the host entry details in your `manifest.json` file and unload the plugin from all supported apps that are currently connected to the CLI service.

If more than one version of the app is running, you can limit this app to a specific version by appending the version string to the app ID.

For eg, to unload the plugin from all supported apps:

    $ uxp plugin unload

To limit the unload to only one version:

    $ uxp plugin unload --apps PS@21.1.0

### Watching a plugin directory and reloading contents on change

You can watch a plugin like this:

    $ uxp plugin watch [--path <relative path>] [--apps <appId ...>]

#### Options

**--path**
Relative path to plugin's source folder. Defaults to the current working directory.

**--apps**
A list of apps that you want to watch the plugin for and reload contents on change. If you don't provide this argument, the CLI will look into the host entry details in your `manifest.json` file, watch the plugin directory and reload plugin into all supported apps that are currently connected to the CLI service when changes are saved.

If more than one version of the app is running, you can limit this app to a specific version by appending the version string to the app ID.

For eg, to limit the watch and reload to only one version:

    $ uxp plugin watch --apps PS@21.1.0

### Plugin logs

_After you have loaded your plugin once with `uxp plugin load`_, you can view plugin logs using this command.
This command launches a plugin console window where logs can be viewed

    $ uxp plugin logs 

### Plugin package

_After you have created your plugin , you can package your plugin using this command.

    $ uxp plugin package 

#### options

**--manifest**

The path to the plugin's manifest.json file. If the final plugin code is generated in a sub-folder (say, a "build" or "dist" folder), then you need to provide the path to this folder.

**--apps**
A list of apps for which you want to package the plugin. If you don't provide this argument, the CLI will look into the host entry details in your `manifest.json` and will generate the separate packages for all the host application.

    $ uxp plugin package --apps PS

**--outputPath**
Output directory path where plugin will be packaged. Defaults to current working directory.

    $uxp plugin package --outputPath <path>


# Contributing

Contributions are welcome! Read the [Contributing Guide](CONTRIBUTING.md) for more information.

# Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
