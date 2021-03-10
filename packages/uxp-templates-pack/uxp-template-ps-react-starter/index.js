/*
    Creating empty index file to resolve the file path.
 */

const templateModule = {
    "devtools": {
        // manifestPath should point to manifest json location relative to the 'template' folder.
        // if this is not specified - then this defaults to "manifest.json" directly within 'template' folder.
        "manifestPath" : "plugin/manifest.json",
        // buildDir is advanced option - this is the final build directory of the plugin. 
        // This is the folder which gets loaded into the Host application and parsed by UXP System. 
        // The manifest.json file will be read from this directory - this folder can be mapped ( viewed as ) to your plugin's final distribuation folder.
        // this option can be used for projects like react, typescript - where the source files are webpacked and final JS file is generated in 
        // a separate build folder - typically 'dist'. So, developers can use this option to override the Devtools default behaviour and ask it to pick / watch this build directory.
        // this should be again relative to the 'template'. 
        // If not present, this defaults to same directory as 'manifestPath' file.
        "buildDir": "dist"
    },
    // packageDir should always have the '__dirname' as its value.
    // the UXP Plugin initializatin command will look for directory with name "template" in this directory.
    "packageDir": __dirname
}

module.exports = templateModule;