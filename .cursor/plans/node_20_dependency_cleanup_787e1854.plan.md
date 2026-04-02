---
name: Node 20 dependency cleanup
overview: Identify and clean up dependencies that are unused or can be replaced with Node 20 built-ins to reduce bundle size and maintenance burden.
todos:
  - id: remove-unused
    content: "Remove unused dependencies: babel-polyfill, babel-register, app-path, fancy-log"
    status: completed
  - id: replace-fs-extra
    content: Replace fs-extra with native fs in 7 files
    status: completed
  - id: replace-shell-exec
    content: Replace shell-exec with child_process in KillProcess.js
    status: completed
  - id: replace-isomorphic-ws
    content: Replace isomorphic-ws with ws in Connection.js
    status: completed
  - id: replace-lodash
    content: Replace lodash with lodash-es in 10 files
    status: completed
  - id: upgrade-deps
    content: "Upgrade dependencies: yargs, chokidar, express, ws, archiver, chalk"
    status: completed
  - id: update-engine
    content: Update engines.node to >=20.0.0 in package.json
    status: completed
isProject: false
---

# Node 20 Dependency Cleanup Plan

## Dependencies to REMOVE (unused)

These dependencies are listed in package.json but never imported anywhere:

| Package          | Location          | Reason                   |
| ---------------- | ----------------- | ------------------------ |
| `babel-polyfill` | root package.json | Not imported, deprecated |
| `babel-register` | root package.json | Not imported             |
| `app-path`       | uxp-devtools-cli  | Not imported anywhere    |
| `fancy-log`      | uxp-devtools-core | Not imported anywhere    |

## Dependencies to REPLACE with Node 20 built-ins

### 1. `fs-extra` -> Native `fs` (7 files)

Node 20 provides native equivalents for all `fs-extra` methods used:

- `ensureDirSync()` -> `fs.mkdirSync(path, { recursive: true })`
- `copySync()` -> `fs.cpSync(src, dest, { recursive: true })`
- `removeSync()` -> `fs.rmSync(path, { recursive: true, force: true })`
- `emptyDirSync()` -> `fs.rmSync() + fs.mkdirSync()`
- Other methods (`existsSync`, `readdirSync`, `readFileSync`, etc.) are already native

**Files to update:**

- [packages/uxp-devtools-core/src/core/client/plugin/actions/init/utils.js](packages/uxp-devtools-core/src/core/client/plugin/actions/init/utils.js)
- [packages/uxp-devtools-core/src/core/client/plugin/actions/PluginTestCommand.js](packages/uxp-devtools-core/src/core/client/plugin/actions/PluginTestCommand.js)
- [packages/uxp-devtools-core/src/core/client/plugin/actions/PluginTestBaseCommand.js](packages/uxp-devtools-core/src/core/client/plugin/actions/PluginTestBaseCommand.js)
- [packages/uxp-devtools-core/src/core/service/clients/AppClient.js](packages/uxp-devtools-core/src/core/service/clients/AppClient.js)
- [packages/uxp-devtools-helper/scripts/devtools_setup.js](packages/uxp-devtools-helper/scripts/devtools_setup.js)
- [packages/uxp-devtools-helper/src/devtools/command.js](packages/uxp-devtools-helper/src/devtools/command.js)
- [packages/uxp-devtools-cli/src/cli/commands/plugin/init/TemplateBasedInitWorkflow.js](packages/uxp-devtools-cli/src/cli/commands/plugin/init/TemplateBasedInitWorkflow.js)

### 2. `shell-exec` -> Native `child_process` (1 file)

Replace with `child_process.exec` wrapped in a Promise or use `execSync`:

**File:** [packages/uxp-devtools-core/src/core/common/KillProcess.js](packages/uxp-devtools-core/src/core/common/KillProcess.js)

```javascript
// Before
import sh from "shell-exec";
sh("netstat -nao").then(...)

// After
import { exec } from "node:child_process";
import { promisify } from "node:util";
const execAsync = promisify(exec);
execAsync("netstat -nao").then(...)
```

### 3. `isomorphic-ws` -> Direct `ws` import (1 file)

Since this is a Node.js CLI (not browser), `isomorphic-ws` is unnecessary. Use `ws` directly:

**File:** [packages/uxp-devtools-core/src/core/client/connection/Connection.js](packages/uxp-devtools-core/src/core/client/connection/Connection.js)

```javascript
// Before
import WebSocket from "isomorphic-ws";

// After
import WebSocket from "ws";
```

### 4. `lodash` -> `lodash-es` (10 files)

Replace `lodash` with `lodash-es` for proper ESM tree-shaking. Change from namespace import to named imports:

**Files to update:**

- [packages/uxp-devtools-core/src/core/client/plugin/actions/init/utils.js](packages/uxp-devtools-core/src/core/client/plugin/actions/init/utils.js) - uses `intersection`
- [packages/uxp-devtools-core/src/core/client/plugin/actions/PluginTestBaseCommand.js](packages/uxp-devtools-core/src/core/client/plugin/actions/PluginTestBaseCommand.js) - uses `intersection`
- [packages/uxp-devtools-core/src/core/client/plugin/actions/PluginBaseCommand.js](packages/uxp-devtools-core/src/core/client/plugin/actions/PluginBaseCommand.js) - uses `find`, `isEqual`
- [packages/uxp-devtools-core/src/core/client/plugin/PluginSession.js](packages/uxp-devtools-core/src/core/client/plugin/PluginSession.js) - uses `find`, `isEqual`
- [packages/uxp-devtools-core/src/core/client/connection/CliClientController.js](packages/uxp-devtools-core/src/core/client/connection/CliClientController.js) - uses `remove`, `find`, `isEqual`
- [packages/uxp-devtools-core/src/core/service/clients/AppClient.js](packages/uxp-devtools-core/src/core/service/clients/AppClient.js) - uses `cloneDeep`
- [packages/uxp-devtools-core/src/core/helpers/AppsHelper.js](packages/uxp-devtools-core/src/core/helpers/AppsHelper.js) - uses `filter`, `find`
- [packages/uxp-devtools-core/src/core/common/WatchServiceMgr.js](packages/uxp-devtools-core/src/core/common/WatchServiceMgr.js) - uses `debounce`
- [packages/uxp-devtools-cli/src/cli/commands/plugin/init/TemplateBasedInitWorkflow.js](packages/uxp-devtools-cli/src/cli/commands/plugin/init/TemplateBasedInitWorkflow.js) - uses `intersection`
- [packages/uxp-devtools-cli/src/cli/commands/plugin/init/BasicInitWorkflow.js](packages/uxp-devtools-cli/src/cli/commands/plugin/init/BasicInitWorkflow.js) - uses `merge`

```javascript
// Before
import _ from 'lodash';

// After
import { debounce, find } from 'lodash-es';

_.debounce(fn, 200);
_.find(arr, predicate);
debounce(fn, 200);
find(arr, predicate);
```

## Dependencies to UPGRADE

These dependencies should be upgraded to their latest versions for Node 20 compatibility and security:

| Package      | Location            | Current | Latest  | Notes                               |
| ------------ | ------------------- | ------- | ------- | ----------------------------------- |
| `yargs`      | uxp-devtools-cli    | ^15.3.1 | ^18.0.0 | ESM-first, requires Node 20.19+     |
| `yargs`      | uxp-webdriver       | ^12.0.5 | ^18.0.0 | Same as above                       |
| `chokidar`   | uxp-devtools-core   | ^3.4.2  | ^5.0.0  | ESM-only, requires Node 20.19+      |
| `express`    | uxp-devtools-core   | ^4.17.1 | ^5.2.1  | Major upgrade with breaking changes |
| `ws`         | uxp-devtools-core   | ^8.12.0 | ^8.19.0 | Minor upgrade                       |
| `archiver`   | uxp-devtools-core   | 5.3.0   | ^7.0.1  | Major upgrade                       |
| `chalk`      | cli + core          | ^3.0.0  | ^5.6.2  | ESM-only in v5 (already using ESM)  |
| `cli-table3` | uxp-devtools-cli    | ^0.6.0  | ^0.6.5  | Minor upgrade                       |
| `semver`     | uxp-devtools-cli    | ^7.3.2  | ^7.7.0  | Minor upgrade                       |
| `tar`        | uxp-devtools-helper | ^6.0.1  | ^7.4.0  | Major upgrade                       |
| `prompts`    | uxp-devtools-cli    | ^2.3.2  | ^2.4.2  | Minor upgrade                       |

### Express 5 migration notes

Express 5 has breaking changes:

- `req.host` removed (use `req.hostname`)
- `req.acceptsCharset()` renamed to `req.acceptsCharsets()`
- `app.del()` removed (use `app.delete()`)
- Path route matching is stricter
- Promise rejection handling changed

Review [packages/uxp-devtools-core/src/core/service/Server.js](packages/uxp-devtools-core/src/core/service/Server.js) for compatibility.

## Dependencies to KEEP (no changes needed)

These have no adequate Node 20 built-in replacement:

| Package                 | Reason to keep                       |
| ----------------------- | ------------------------------------ |
| `chokidar`              | More reliable than native `fs.watch` |
| `ws`                    | No built-in WebSocket server         |
| `express`               | No built-in HTTP framework           |
| `archiver`              | No built-in ZIP creation             |
| `tar`                   | No built-in TAR handling             |
| `prompts`, `cli-table3` | CLI tooling                          |
| `ignore-walk`           | gitignore-aware directory walking    |

## Update engine requirement

Update root [package.json](package.json) to require Node 20:

```json
"engines": {
  "node": ">=20.0.0"
}
```
