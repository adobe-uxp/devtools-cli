# Overview

UXP CLI is a standard tool for rapid Adobe UXP plugin development. UXP CLI provides the ability to do all of the following from the command line:

- **Discover** UXP-compatible Adobe apps.
- **Load** your development plugins in a target app (no symlinks or deep file system spelunking required).
- **Reload** your currently running plugin instance with new changes (no app restart required).
- **Launch** a rich DevTools environment for debugging your plugin.
- **View** your plugin logs.

**Current host app support matrix**

| Host Apps with UXP | DevTools Support Added                                |
| ------------------ | ----------------------------------------------------- |
| Photoshop          | PS June 2020 Release Builds with UXP 3.8.24 or higher |
| Illustrator        | Not available yet                                     |
| XD                 | Not available yet                                     |

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

#### Repo setup

- Either clone this repository to your local machine or download and extract the zip
- `cd` into the resulting `uxp-devtools-cli` directory
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

You can initialize or bootstrap a directory as a UXP plugin by running this command:

    $ uxp plugin init [--template <template-source>]

    --template: The template source for the plugin. If a template is not provided, the CLI will prompt you to enter plugin details.
    A template can be one of:
      - the default template provided with the CLI called 'ps-starter'
      - a local path relative to the current working directory (e.g. ../my-custom-template)

### Loading a plugin into one or more host apps

You can load a plugin into a host app like this this:

    $ uxp plugin load [--manifest <path>] [--app <appId ...>]

#### Options

**--manifest**

The path to the plugin's manifest.json file. If the final plugin code is generated in a sub-folder (say, a "build" or "dist" folder), then you need to provide the path to this folder.

**--app**
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

Limit the load to only one verion:

    $ uxp plugin load --app PS@21.1.0

### Reloading a plugin

_After you have loaded your plugin once with `uxp plugin load`_, you can reload the plugin into the host application using this command:

    $ uxp plugin reload

**Note:** This will reload all changes done in the plugin **except for manifest changes**. To reload your manifest, you will need to run `uxp plugin load`.

### Debugging a plugin

_After you have loaded your plugin once with `uxp plugin load`_, you can debug the plugin using this command:

    $ uxp plugin debug

### Plugin logs

_After you have loaded your plugin once with `uxp plugin load`_, you can get the log path using this command.

    $ uxp plugin log path [--app <appId ...>]

#### Options

**--app**
List of apps you want to get the log path for. If you don't provide this argument, the CLI will list the log paths for all the apps in which the plugin has been loaded.

## Contributing

Contributions are welcome! Read the [Contributing Guide](CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
