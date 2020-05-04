/* eslint-disable no-console */
const path = require('path');
const fs = require('fs-extra');
const process = require('process');
const tar = require('tar');

function extractdevToolsTarLib(tarPath, dest) {
    return tar.extract({
        file: tarPath,
        cwd: dest,
    });
}

function setupTargetFolder() {
    const destDir = path.resolve(__dirname, '../build/');
    // clean-up the old build artifacts.
    if (fs.existsSync(destDir)) {
        fs.removeSync(destDir);
    }
    fs.ensureDirSync(destDir);
    return destDir;
}

function postSetupInstallStep() {
    if (process.platform === 'darwin') {
    // npm install strips the symlinks from the adobe_caps framework, so we need to recreate them

        const cwd = process.cwd();
        process.chdir(`${__dirname}/../build/Release/adobe_caps.framework`);

        try {
            fs.symlinkSync('Versions/A/adobe_caps', './adobe_caps', 'file');
        } catch (e) {
            if (e.code !== 'EEXIST') {
                process.exit(1);
            }
        }

        try {
            fs.symlinkSync('Versions/A/Resources', './Resources', 'dir');
        } catch (e) {
            if (e.code !== 'EEXIST') {
                process.exit(1);
            }
        }

        process.chdir('./Versions');
        fs.chmodSync('./A/adobe_caps', '755');

        try {
            fs.symlinkSync('A', './Current', 'dir');
        } catch (e) {
            if (e.code !== 'EEXIST') {
                process.exit(1);
            }
        }
        process.chdir(cwd);
    }
}

function setupDevtoolsNativeAddOn() {
    console.log('Setting up Adobe devTools node native add-on library... ');
    const targetFolder = setupTargetFolder();
    const fileName = `DevtoolsHelper-v1.0.0-node-${process.platform}-x64.tar.gz`;
    const devToolsTarPath = path.resolve(__dirname, `./native-libs/${fileName}`);
    const prom = extractdevToolsTarLib(devToolsTarPath, targetFolder);
    prom.then(() => {
        postSetupInstallStep();
        console.log('Adobe devToolsJS native add-on setup successfull.');
    }).catch((err) => {
        throw new Error(`Adobe devTools-JS native add-on setup failed with error ${err}`);
    });
}

setupDevtoolsNativeAddOn();
