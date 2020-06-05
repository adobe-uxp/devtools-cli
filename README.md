## Overview

UXP CLI is a standard tooling for Adobe UXP plugin development. Its a full system to help rapid uxp plugin development, providing:

-   Discover uxp compatible Adobe apps from cli.
-   Load your locally developed plugins in the target Adobe app. Current Support Matrix

    | Host App Integrated with UXP   | DevTools Support Added |
    | ------------- | ------------- |
    | PhotoShop  | PS June 2020 Release Builds with UXP 3.8.24 or higher |
    | Illustrator | Not available yet |
    | XD | Not available yet |
    
-   Debug your plugin.
-   View your plugin Logs from cli.
-   Reload your currently running plugin instance with new changes.

## Getting Started


### Software requirement

- Yarn version >= 1.5
- Node version >= 10.16

Devtools helper uses N-api v4. Node-version and n-api compatible matrix  is available [here](https://nodejs.org/api/n-api.html#n_api_n_api_version_matrix)

### Setup

#### One time setup of the Yarn package downloader
    npm install -g yarn

You need to set the `yarn global bin` path to the PATH environment variable to access `uxp` command directly from terminal. 

##### Mac

You can run this command on terminal to add yarn global bin path.

    export PATH="$(yarn global bin):$PATH"
    

##### Windows

You can add yarn global bin path to system variables by following the steps given [here](https://docs.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ee537574(v%3Doffice.14)).


### Installation

Navigate to the root of this project and type:

    yarn install
 

### Quick guide for getting started

For getting started with CLI, You need to setup UXP Developer tools in your machine using below steps.
- Note that on Windows you need to run these commands in `PowerShell` or `Command Prompt`.

    - Clone this repository to your local machine/ Extract the zip
    - Cd into uxp-devtools-cli directory
    - Run yarn install
    
After a successful yarn install, First, start a cli service ( Make sure Application is running ) 

```$ uxp service start```

> **IMPORTANT**
>
> For macOS, there is a bug where `uxp service start` won't work if devtools hasn't been enabled before. If you can a permissions error about a path, use the following steps to work around it manually.
>
> * Navigate to `/Library/Application Support/Adobe/UXP/Developer`
> * Create a new file called `settings.json` (this will require `sudo`). I use `vi`, but any editor will do.
> 
> Inside this file, put:
> 
> ```
> {
>         "developer": true
> }
> ```


In another terminal instance - run plugin commands for to load plugin 

```$ uxp plugin load```

To debug ( Note: the plugin needs to be loaded first - via above load commnad for debug to work )

```$ uxp plugin debug```


### Help Commands

You can run the following commands if you need to list of commands available in cli and to get details of command.

    $ uxp help
    // prints details of all the commands available in the cli.
  
    $ uxp <command> --help
    // prints details of specific command.

### Apps Commands

Get details of apps which support the uxp developer workflow.

    $ uxp apps list

Output: The output will be something similar to - 

ID  Version Name
PS  21.0.3 Photoshop
XD  28.0.12 "Adobe XD"

Note: This first column is app ID that you will use in other dev commands. This ID string is similar to app-id user would specify in manifest.json -> host -> app entry.

If you have more than one version of the same app installed ( say, standard & pre-release version ) then you would both the apps listed in the output but each having its own version - for eg:

ID  Version  Name
PS  21.0.3   Adobe Photoshop
PS  21.1.0   Adobe Photoshop <- this is pre-release.  
XD  28.0.12  Adobe XD

#### Enable UXP Developer Tooling

Before you run any uxp developer commands to load, debug your plugin. You need to first enable the uxp developer tooling. To do that you need to run the following command.

    uxp devtools enable
**Note**:  This command will prompt the user with a OS Credentials Dialog where user need to enter the machine user name and password to allow the command to run.

This is done for security reasons so that some random external scripts can't issue plugin load commands to the apps to load unauthorised plugins etc without user  knowledge.

Disable Uxp devtools

Once you are done with the uxp tooling you need to disable the devtools by running the following command -

    $ uxp devtools disable

### CLI Service.

The cli and apps communicate ( send commands ) with each other using a web-socket connection.

For this you need to start service. This runs a server at the port specified in the above `devtools enable` command.

Command to start this service is

      $ uxp service start [--port <port>] 

     Options:
    --port:  The port is  where the service will run, defaults to 14001

Now the cli service is running, you need to open a separate terminal instance to run the actual developer tool commands -

You can use the new terminal instance to run other project commands like plugin load, reload, debug etc.


### Running Plugin Developer Commands

Assuming you are currently "cd" into your plugin project folder and that the cli service is running.

### Plugin Initialization

You can initialize a directory as an UXP plugin by running the command below.

    $ uxp plugin init [--template <template-source>]

    --template: The template source for the plugin. If template is not provided the cli prompts you for entering plugin details.
    A template can be one of:
      - a default template provide with cli called 'ps-starter'
      - a local path relative to the current working directory: Eg. file:../my-custom-template


#### Load Plugin into host app

you can load this plugin into target app as below

    $ uxp plugin load [--manifest <path>] [--app <appId ...>]
     
    Options:
    --manifest: Path to plugin's manifest.json file ( that the UXP will finally see ). If the final plugin code is generated in some sub-folder, say, "build" or "dist" folder ( due to your custom internal build scripts and copying your manifest.json to that location ) then you need to provide the path to this final folder.
     
    --app: List of apps that you want to load this plugin into. If you don't provide this argument the cli will look into host entry details in manifest.json file and load this plugin into all the supported apps that are currently connected to the cli-service.
    If more than one version of the app is running - you can limit this app to a specific version by appending the version string to app ID -
     
    for eg: if both standard and pre-release versions of PS are running
     
    ( assuming apps list command would have produced the following output )
    ID Name Version
    PS Photoshop 21.0.3 ( standard released version )
    PS Photoshop 21.1.0 ( pre-release version of PS )
     
    $ uxp plugin load
    command would load the plugin into both the apps.
     
    if you want to limit the load to only pre-release, you can do the following -
     
    $ uxp plugin load --app PS@21.1.0

### Reloading Plugin
   From a plugin folder, you can reload the plugin in the host application using the below command. This would reload all the changes done in the plugin except for manifest changes. 
   
    $ uxp plugin reload
    
- Note that plugin needs to be loaded with above `plugin load` command first.
    
#### Debugging Plugin

To debug your plugin run following command  

    $ uxp plugin debug

- Note that plugin needs to be loaded with above `plugin load` command first.

### Plugin Logs

For a plugin you can get the log path using the below command.

    $ uxp plugin log path [--app <appId ...>]

    --app: List of apps for which you want to get the log path. If you don't provide this argument the cli will list the log path for all the apps in which the plugin is loaded.

- Note that plugin needs to be loaded with `plugin load` commands first.


### Contributing

Contributions are welcomed! Read the [Contributing Guide](CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
