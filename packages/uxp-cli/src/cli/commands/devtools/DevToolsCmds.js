
function handleEnableCommand() {
    this.uxp.setMode('client');
    const prom = this.uxp.devToolsMgr.enableDevTools();
    return prom.then((result) => {
        if (result) {
            this.log('UXP DevTools is Enabled now.');
        }
    });
}

const enableCommand = {
    command: 'enable',
    description: 'Configures the UXP Developer service to permit loading and debugging of plugins in development.',
    handler: handleEnableCommand,
};

function handleDisableCommand() {
    this.uxp.setMode('client');
    const prom = this.uxp.devToolsMgr.disableDevTools();

    return prom.then((result) => {
        if (result) {
            this.log('UXP Developer Tools is Disabled now.');
        }
    });
}

const disableCommand = {
    command: 'disable',
    description: 'Prevents plugins in development from being loaded or debugged.',
    handler: handleDisableCommand,
};

module.exports = {
    enableCommand,
    disableCommand,
};
