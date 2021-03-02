
let panel;
let statusDialog;

function create() {
    const HTML =
        `<style>
            .break {
                flex-wrap: wrap;
            }
            label.row > span {
                color: #8E8E8E;
                width: 20px;
                text-align: right;
                font-size: 9px;
            }
            label.row input {
                flex: 1 1 auto;
            }
            .show {
                display: block;
            }
            .hide {
                display: none;
            }
            .title {
                color: #8E8E8E;
            }
        </style>
        <form method="dialog" id="main">
            <div class="row break">
            <label class="row">
            <span>Name</span>
            <input type="text" uxp-quiet="true" id="name" placeholder="Name" />
            </label>
            <h1>Plugin Div</h1>
            <div id="hello"></div>
            </div>
            <footer><button id="ok" type="submit" uxp-variant="cta">Ok</button></footer>
        </form>
        `
    function submitFunction() {
        statusDialog = document.createElement("dialog");
        const html = `
        <form method="dialog" id="main">
            <title class="title">Submitted successfully! </title>
            <footer><button id="done" type="submit" uxp-variant="cta">OK</button></footer>
        </form>
        `;
        statusDialog.innerHTML = html;
        document.appendChild(statusDialog);
        return statusDialog.showModal();
     }

    panel = document.createElement("div");
    panel.innerHTML = HTML;
    panel.querySelector("form").addEventListener("submit", submitFunction);
    return panel;
}

function show(event) {
    event.node.appendChild(create());
}

function update() {
    let form = document.querySelector("form");
    let warning = document.querySelector("#warning");
        form.className = "show";
        warning.className = "hide";
}


module.exports = {
    panels: {
        samplePlugin: {
            show,
            update
        }
    }
};
