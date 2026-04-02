---
name: TypeScript Migration Plan
overview: Migrate 79 JavaScript files across 4 packages to TypeScript with strict mode, using tsc for compilation to dist, wildcard exports, and a shared base tsconfig package following the uxp-toolkit-2 patterns.
todos:
  - id: setup-tsconfig-pkg
    content: Create @adobe-fixed-uxp/tsconfig package with base configuration
    status: completed
  - id: setup-root-tsconfig
    content: Create root tsconfig.json with project references
    status: completed
  - id: migrate-feature
    content: Migrate uxp-devtools-feature package to TypeScript (2 files)
    status: completed
  - id: migrate-helper
    content: Migrate uxp-devtools-helper package to TypeScript (4 files)
    status: completed
  - id: create-types
    content: Create shared type definitions for handlers, messages, and globals
    status: completed
  - id: migrate-core
    content: Migrate uxp-devtools-core package to TypeScript (48 files)
    status: completed
  - id: migrate-cli
    content: Migrate uxp-devtools-cli package to TypeScript (25 files)
    status: completed
  - id: setup-exports
    content: Configure package.json exports with wildcards for all packages
    status: completed
  - id: verify-build
    content: Verify tsc build and fix any remaining type errors
    status: completed
isProject: false
---

# TypeScript Migration Plan

## Overview

Migrate 79 JavaScript files across 4 packages to TypeScript:

- `uxp-devtools-cli`: 25 files
- `uxp-devtools-core`: 48 files
- `uxp-devtools-helper`: 4 files
- `uxp-devtools-feature`: 2 files

## Phase 1: Infrastructure Setup

### 1.1 Create `@adobe-fixed-uxp/tsconfig` package

Create new package at `packages/tsconfig/`:

```
packages/tsconfig/
  package.json
  tsconfig.base.json
```

**tsconfig.base.json** (following uxp-toolkit-2 pattern):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.2 Root tsconfig.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./packages/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "references": [
    { "path": "packages/uxp-devtools-feature" },
    { "path": "packages/uxp-devtools-helper" },
    { "path": "packages/uxp-devtools-core" },
    { "path": "packages/uxp-devtools-cli" }
  ]
}
```

### 1.3 Package exports pattern (wildcard)

Each package.json will use this exports pattern:

```json
{
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*.ts",
      "import": "./src/*.ts"
    },
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js"
      },
      "./*": {
        "types": "./dist/*.d.ts",
        "import": "./dist/*.js"
      },
      "./package.json": "./package.json"
    }
  }
}
```

### 1.4 Build scripts

Add to root package.json:

```json
{
  "scripts": {
    "build": "pnpm -r run build",
    "typecheck": "tsc --build"
  }
}
```

Each package:

```json
{
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

## Phase 2: Type Definitions for Dynamic Patterns

### 2.1 Handler method interfaces

The key challenge is typing dynamic method calls like `this[`handler_${cmd}`]`. Create interfaces in [packages/uxp-devtools-core/src/types/handlers.ts](packages/uxp-devtools-core/src/types/handlers.ts):

```typescript
// Message types
export interface BaseMessage {
  command: string;
  requestId?: number;
}

export interface PluginMessage extends BaseMessage {
  command: 'Plugin';
  action: 'load' | 'unload' | 'reload' | 'debug' | 'list' | 'validate';
  pluginSessionId?: string;
  params?: Record<string, unknown>;
}

// Handler callback type
export type RequestCallback = (err: Error | null, reply: BaseMessage) => void;

// Handler method maps
export interface MessageHandlers {
  msg_reply: (data: BaseMessage) => void;
  msg_proxy: (data: ProxyMessage) => void;
  msg_UXP?: (message: UXPMessage) => void;
  msg_CDT?: (message: CDTMessage) => void;
  msg_CDTBrowser?: (message: CDTBrowserMessage) => void;
  msg_initRuntimeClient?: () => void;
}

export interface RequestHandlers {
  handler_Plugin?: (message: PluginMessage, callback: RequestCallback) => void;
}

export interface EventHandlers {
  on_didAddRuntimeClient?: (data: RuntimeClientData) => void;
  on_clientDidConnect?: () => void;
  on_UDTAppQuit?: () => void;
  // ... other event handlers
}
```

### 2.2 Base Client class with typed dynamic dispatch

```typescript
// In Client.ts
type MessageCommand = 'reply' | 'proxy' | 'UXP' | 'CDT' | 'CDTBrowser' | 'initRuntimeClient';
type HandlerCommand = 'Plugin';
type EventName = 'didAddRuntimeClient' | 'clientDidConnect' | 'UDTAppQuit' | ...;

abstract class Client extends EventEmitter {
  // Index signatures for dynamic methods
  [key: `msg_${MessageCommand}`]: ((message: BaseMessage) => void) | undefined;
  [key: `handler_${HandlerCommand}`]: ((message: BaseMessage, cb: RequestCallback) => void) | undefined;
  [key: `on_${EventName}`]: ((...args: unknown[]) => void) | undefined;

  handleEvent(name: EventName, ...args: unknown[]): void {
    const fn = this[`on_${name}`];
    if (fn) {
      fn.apply(this, args);
    }
  }

  _handleClientMessage(messageJson: string | Buffer): void {
    // ... parsing logic
    const fn = this[`msg_${message.command as MessageCommand}`];
    if (fn) {
      fn.call(this, message);
    }
  }
}
```

### 2.3 UDTClient command map

```typescript
// In UDTClient.ts
type PluginCommand =
  | 'debugPlugin'
  | 'refreshList'
  | 'loadPlugin'
  | 'unloadPlugin'
  | 'reloadPlugin'
  | 'validatePluginManifest'
  | 'packagePlugin'
  | 'setupTest'
  | 'executeTest';

interface CommandMethods {
  debugPlugin: (params: DebugParams) => Promise<DebugResult>;
  loadPlugin: (params: LoadParams) => Promise<LoadResult>;
  // ... other commands
}

class UxpDevToolsClient implements CommandMethods {
  executePluginCommand<K extends PluginCommand>(
    commandName: K,
    ...args: Parameters<CommandMethods[K]>
  ): ReturnType<CommandMethods[K]> {
    const method = this[commandName];
    if (!method) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    return method.apply(this, args);
  }
}
```

## Phase 3: Package-by-Package Migration

### 3.1 Migration order (dependency order)

1. **uxp-devtools-feature** (2 files, no internal deps)
2. **uxp-devtools-helper** (4 files, depends on feature)
3. **uxp-devtools-core** (48 files, depends on helper)
4. **uxp-devtools-cli** (25 files, depends on core)

### 3.2 Per-package tsconfig.json

Example for uxp-devtools-core:

```json
{
  "extends": "@adobe-fixed-uxp/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src"],
  "references": [
    { "path": "../uxp-devtools-helper" }
  ]
}
```

### 3.3 Key files requiring significant typing

**High complexity (dynamic patterns):**

- [packages/uxp-devtools-core/src/core/service/clients/Client.js](packages/uxp-devtools-core/src/core/service/clients/Client.js) - 3 dynamic patterns
- [packages/uxp-devtools-core/src/core/client/connection/Connection.js](packages/uxp-devtools-core/src/core/client/connection/Connection.js) - msg_* pattern
- [packages/uxp-devtools-core/src/core/udt/UDTClient.js](packages/uxp-devtools-core/src/core/udt/UDTClient.js) - command dispatch
- [packages/uxp-devtools-core/src/core/common/Logger.js](packages/uxp-devtools-core/src/core/common/Logger.js) - dynamic method creation

**Inheritance chains:**

- `PluginBaseCommand` -> 10+ subclasses
- `Client` -> `AppClient`, `CDTClient`, `BrowserCDTClient`, `UxpCliClient`

**Global UxpLogger:**

- Currently accessed as global `UxpLogger` throughout codebase
- Need to add type declaration or convert to explicit import

## Phase 4: Global Types and Declarations

### 4.1 Create global type declarations

File: `packages/uxp-devtools-core/src/types/globals.d.ts`

```typescript
import type { Logger } from '../common/Logger';

declare global {
  const UxpLogger: Logger;
}

export {};
```

### 4.2 Shared types package structure

```
packages/uxp-devtools-core/src/types/
  index.ts          # Re-exports all types
  handlers.ts       # Handler interfaces
  messages.ts       # Message types
  plugins.ts        # Plugin-related types
  apps.ts           # App endpoint types
  globals.d.ts      # Global declarations
```

## Phase 5: File Renaming and Conversion Steps

For each `.js` file:

1. Rename to `.ts`
2. Add type annotations to function parameters and return types
3. Add type annotations to class properties
4. Replace `any` with proper types where possible
5. Add explicit `override` keyword for overridden methods
6. Fix any type errors revealed by strict mode

## Estimated Changes Summary


| Package              | Files      | Complexity              |
| -------------------- | ---------- | ----------------------- |
| tsconfig (new)       | 2          | Low                     |
| uxp-devtools-feature | 2          | Low                     |
| uxp-devtools-helper  | 4          | Low                     |
| uxp-devtools-core    | 48 + types | High (dynamic patterns) |
| uxp-devtools-cli     | 25         | Medium                  |


## Build Output Structure

After migration, each package will have:

```
packages/uxp-devtools-core/
  src/           # TypeScript source
  dist/          # Compiled JavaScript + declarations
    index.js
    index.d.ts
    core/
      service/
        clients/
          Client.js
          Client.d.ts
          ...
```

## Notes

- The CLI entry point (`uxp.js`) will become `uxp.ts` with shebang preserved
- JSON imports via `createRequire` will need type assertions
- Native module bindings (`node-gyp-build`) will need `@types` or manual declarations
- EventEmitter usage will need typed event maps

