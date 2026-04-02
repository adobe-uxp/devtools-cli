/*
 *  Copyright 2017 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

import type { Buffer } from 'node:buffer';
import type { StdioOptions } from 'node:child_process';
import { exec, execSync, spawn } from 'node:child_process';

// Simple verbose logger
const log = {
  verbose: (msg: string): void => {
    if (process.env.VERBOSE) {
      console.log(msg);
    }
  },
};

interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  capture?: boolean;
  silent?: boolean;
  stdio?: StdioOptions;
  onStdout?: (event: 'data' | 'close', data?: Buffer) => void;
  onStderr?: (event: 'data' | 'close', data?: Buffer) => void;
}

interface ExecOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
}

interface CaptureResult {
  stdout: string;
  stderr: string;
}

interface SpawnError extends Error {
  stdout?: string;
  stderr?: string;
}

interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
}

function adjustCommand(cmd: string): string {
  if (process.platform === 'win32') {
    switch (cmd) {
      case 'npm':
      case 'gulp':
      case 'gr':
        return `${cmd}.cmd`;
    }
  }
  return cmd;
}

function spawnFunc(cmd: string, args: string[] = [], opts: SpawnOptions = {}): Promise<CaptureResult> {
  cmd = adjustCommand(cmd);

  return new Promise((resolve, reject) => {
    const output = opts.capture ? 'pipe' : 'inherit';
    const stdout = opts.silent ? 'ignore' : output;
    const stderr = opts.silent ? 'ignore' : output;
    const stdin = 'inherit';

    const spawnOpts = {
      cwd: opts.cwd ?? process.cwd(),
      env: { ...process.env, ...opts.env ?? {} },
      stdio: opts.stdio ?? [stdin, stdout, stderr] as StdioOptions,
    };

    log.verbose(`Running "${cmd} ${args.join(' ')}" in ${spawnOpts.cwd}`);

    const cp = spawn(cmd, args, spawnOpts);

    cp.on('error', (err) => {
      log.verbose(`[Error] Error running "${cmd} ${args.join(' ')}". ${err}`);
      reject(err);
    });

    const capture: CaptureResult = {
      stdout: '',
      stderr: '',
    };

    // node docs say stdout *should* be undefined for non-"pipe" stdout,
    // but testing shows that it is defined and null
    if (cp.stdout !== null) {
      cp.stdout.on('data', (data: Buffer) => {
        if (opts.onStdout !== undefined) {
          opts.onStdout('data', data);
        }

        if (opts.capture && !opts.silent) {
          capture.stdout += data;
        }
      });
    }

    // node docs say stderr *should* be undefined for non-"pipe" stderr
    // but testing shows that it is defined and null
    if (cp.stderr !== null) {
      cp.stderr.on('data', (data: Buffer) => {
        if (opts.onStderr !== undefined) {
          opts.onStderr('data', data);
        }

        if (opts.capture && !opts.silent) {
          capture.stderr += data;
        }
      });
    }

    cp.on('close', (code) => {
      log.verbose(`[Ok] Running "${cmd} ${args.join(' ')}". Code ${code}`);

      if (opts.onStdout !== undefined) {
        opts.onStdout('close');
      }

      if (opts.onStderr !== undefined) {
        opts.onStderr('close');
      }

      if (code === 0) {
        resolve(capture);
        return;
      }

      const err: SpawnError = new Error(`Exit code ${code} for "${cmd} ${args.join(' ')}"`);
      err.stderr = capture.stderr;
      err.stdout = capture.stdout;
      reject(err);
    });
  });
}

function execFunc(cmd: string, opts?: ExecOptions): Promise<CaptureResult> {
  cmd = adjustCommand(cmd);
  return new Promise((resolve, reject) => {
    const options = opts ?? {};
    const execOpts = {
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...options.env ?? {} },
    };

    log.verbose(`Executing ${cmd} in ${execOpts.cwd}`);

    exec(cmd, execOpts, (error, stdout, stderr) => {
      if (error) {
        log.verbose(`[FAILED] ${cmd}. Cwd: ${execOpts.cwd}. STDERR:\n${error}`);

        const execError = error as ExecError;
        execError.stdout = stdout;
        execError.stderr = stderr;
        reject(execError);
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function execSyncFunc(cmd: string, opts: ExecOptions = {}): Buffer {
  cmd = adjustCommand(cmd);

  const execOpts = {
    cwd: opts.cwd ?? process.cwd(),
    env: { ...process.env, ...opts.env ?? {} },
  };

  log.verbose(`Executing ${cmd} in ${execOpts.cwd}`);

  return execSync(cmd, execOpts);
}

export {
  execFunc as exec,
  execSyncFunc as execSync,
  spawnFunc as spawn,
};

export type {
  CaptureResult,
  ExecOptions,
  SpawnOptions,
};
