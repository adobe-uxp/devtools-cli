const path = require('path');

function getPluginPath() {
    const pluginPath = path.join(__dirname, "..", "plugin");
    return pluginPath;
}

const pluginPath = getPluginPath();

module.exports = {
    pluginPath,
};
