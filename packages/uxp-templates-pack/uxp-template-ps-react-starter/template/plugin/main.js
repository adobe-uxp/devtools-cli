
// XD-specific!
global.screen={};
window.WebSocket.prototype.OPEN = 1;

let rootNode;
async function show(event) {
    console.log("starting");
    if (rootNode) return;
    rootNode = event.node;
    document.body.classList.add("xd");
    const contents = await (await fetch("./index.html")).text();
    try {
        document.body.innerHTML = contents;
    } finally {
        const nodes = Array.from(document.querySelectorAll("script[src]"));
        nodes.forEach(node => {
            console.log(`queueing ${node.src}`);
            setTimeout(() => require(`./${node.src}`), 100);
        });
    }
    console.log("done");
}

setTimeout(() => {
    show({node: document});
}, 100);

module.exports = {
    commands: {

    },
    panels: { 
        /*
        editUxpPen: { 
            show(event) { }
        }*/ /*,
        runPanel: { 
            show(event) { }
        }*/
    }
}