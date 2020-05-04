function showLayerNames() {
    const photoshop = window.require("photoshop").app;
    const allLayers = photoshop.activeDocument.layers;
    const allLayerNames = allLayers.map(layer => layer.name);
    const sortedNames = allLayerNames.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    document.getElementById("layers").innerHTML = `<ul>${sortedNames.map(name => `<li>${name}</li>`).join("")}</ul>`;
}

document.getElementById("btnPopulate").addEventListener("click", showLayerNames);

function flyoutMenuShowAlert() {
  const psCore = require('photoshop').core
  psCore.showAlert({ message: 'Hi!' })
}

window['flyoutMenuShowAlert'] = flyoutMenuShowAlert
