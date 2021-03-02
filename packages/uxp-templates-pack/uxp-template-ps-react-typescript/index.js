/*
    Creating empty index file to resolve the file path.
 */
const templateModule = {
    // look into packages/uxp-templates-pack/uxp-template-ps-react-starter/index.js for details on these values.
    "devtools": {
        "manifestPath" : "uxp/manifest.json",
        "buildDir" : "dist"
    },
    // packageDir should always have the '__dirname' as its value.
    // the UXP Plugin initializatin command will look for directory with name "template" in this directory.
    "packageDir": __dirname
}

module.exports = templateModule;