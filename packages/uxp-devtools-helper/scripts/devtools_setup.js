/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as tar from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });
  return destDir;
}

function setupDevtoolsNativeAddOn() {
  if (process.env.CI || process.env.SKIP_DEVTOOLS_NATIVE_ADD_ON_BUILD) {
    console.log('Skipping Adobe devToolsJS native add-on setup in CI environment.');
  }
  console.log('Setting up Adobe devTools node native add-on library... ');
  const arch = os.arch();
  console.log(`Arch is ${arch}`);
  const targetFolder = setupTargetFolder();
  const fileName = arch !== 'arm64' ? `DevtoolsHelper-v1.1.0-node-${process.platform}.tar.gz` : `DevtoolsHelper-v1.1.0-node-${process.platform}-arm64.tar.gz`;
  console.log(`FileName is ${fileName}`);
  const devToolsTarPath = path.resolve(__dirname, `./native-libs/${fileName}`);
  const prom = extractdevToolsTarLib(devToolsTarPath, targetFolder);
  prom.then(() => {
    console.log('Adobe devToolsJS native add-on setup successfull.');
  }).catch((err) => {
    console.error(`Adobe devTools-JS native add-on setup failed with error ${err}`);
  });
}

setupDevtoolsNativeAddOn();
