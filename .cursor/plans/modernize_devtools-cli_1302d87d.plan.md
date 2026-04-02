---
name: Modernize devtools-cli
overview: Modernize the devtools-cli monorepo by setting up proper pnpm workspaces, adding EditorConfig, upgrading ESLint to v9 flat config, migrating from CommonJS to ESM, and adding exports fields to all packages.
todos:
  - id: pnpm-workspace
    content: Create pnpm-workspace.yaml and update root package.json (remove workspaces field, add packageManager)
    status: completed
  - id: editorconfig
    content: Create .editorconfig with 2-space indentation, LF line endings, UTF-8
    status: completed
  - id: eslint-upgrade
    content: "Upgrade ESLint to v9 flat config: delete .eslintrc, create eslint.config.mjs, update dependencies"
    status: completed
  - id: esm-devtools-feature
    content: Migrate uxp-devtools-feature to ESM (smallest package, good starting point)
    status: completed
  - id: esm-devtools-helper
    content: Migrate uxp-devtools-helper to ESM
    status: completed
  - id: esm-devtools-core
    content: Migrate uxp-devtools-core to ESM (largest package)
    status: completed
  - id: esm-devtools-cli
    content: Migrate uxp-devtools-cli to ESM
    status: completed
  - id: esm-inspect-frontend
    content: Migrate uxp-inspect-frontend to ESM
    status: cancelled
  - id: esm-webdriver
    content: Migrate uxp-webdriver to ESM
    status: cancelled
  - id: exports-fields
    content: Add exports fields to all 6 package.json files
    status: completed
  - id: fix-indentation
    content: Run eslint --fix to apply 2-space indentation across codebase
    status: completed
  - id: cleanup-babel
    content: Remove babel CommonJS transform plugin and unused babel dependencies
    status: completed
isProject: false
---

# Modernize devtools-cli Repository

## Current State

- **Workspace**: pnpm lockfile exists but uses yarn-style `workspaces` field in `package.json`
- **Module system**: CommonJS (`require()`/`module.exports`)
- **ESLint**: v6.8.0 with `.eslintrc` JSON format, airbnb-base
- **EditorConfig**: None
- **Package exports**: None (only `main` fields)
- **Indentation**: 4 spaces

## Target State (based on uxp-toolkit-2)

- **Workspace**: pnpm with `pnpm-workspace.yaml`
- **Module system**: ESM (`import`/`export`)
- **ESLint**: v9 with flat config (`eslint.config.mjs`)
- **EditorConfig**: 2-space indentation, LF, UTF-8
- **Package exports**: Full `exports` field with proper conditions

---

## 1. Setup pnpm Workspaces

**Create** `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
```

**Update** [package.json](package.json):

- Remove `workspaces` field
- Add `"packageManager": "pnpm@10.x.x"` (use latest stable)
- Update `engines.node` to `>=18.0.0` (required for ESM)

**Cleanup**:

- Delete `packages/uxp-webdriver/yarn.lock` (has its own yarn.lock)

---

## 2. Add EditorConfig

**Create** `.editorconfig`:

```ini
root = true

[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
```

---

## 3. Update ESLint to v9 Flat Config

**Delete** `.eslintrc`

**Create** `eslint.config.mjs`:

```javascript
import antfu from '@antfu/eslint-config';

export default antfu({
  type: 'lib',
  stylistic: {
    semi: true,
    indent: 2,
  },
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-vars': [
      'warn',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
    ],
  },
});
```

**Update root `package.json` devDependencies**:

- Remove: `eslint@^6.8.0`, `eslint-config-airbnb-base`, `eslint-plugin-import`, `eslint-plugin-react`, `babel-eslint`
- Add: `eslint@^9.x`, `@antfu/eslint-config@^7.x`

**Update lint scripts**:

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

---

## 4. Migrate to ESM

This is the most significant change. Each package needs:

### 4.1 Package.json Changes (all 6 packages)

Add to each package's `package.json`:

```json
"type": "module"
```

### 4.2 Source Code Migration

Convert all files from CommonJS to ESM:

**Before (CommonJS)**:

```javascript
const fs = require('fs-extra');
const { someFunction } = require('./utils');

module.exports = { MyClass };
module.exports = MyClass;
```

**After (ESM)**:

```javascript
import fs from 'fs-extra';
import { someFunction } from './utils.js';
export { MyClass };
export default MyClass;
```

**Key changes needed**:

- All `require()` becomes `import`
- All `module.exports` becomes `export`
- Relative imports must include `.js` extension
- `__dirname` and `__filename` need replacement with `import.meta.url`
- Dynamic requires become dynamic imports

### 4.3 Dependency Updates

Some dependencies need updates for ESM compatibility:

- `chalk@^3.0.0` -> `chalk@^5.0.0` (v5 is pure ESM)
- Check other dependencies for ESM compatibility

### 4.4 Shebang Updates

[packages/uxp-devtools-cli/src/uxp.js](packages/uxp-devtools-cli/src/uxp.js) is a CLI entry point with a bin field - ensure it keeps the shebang:

```javascript
#!/usr/bin/env node
```

### 4.5 Remove Babel CommonJS Transform

Remove from [babel.config.json](babel.config.json):

```json
"@babel/plugin-transform-modules-commonjs"
```

---

## 5. Add Exports Fields

Add `exports` field to each package's `package.json`:

**Pattern** (for packages with single entry point):

```json
{
  "exports": {
    ".": {
      "import": "./src/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

**Packages and their exports**:

| Package              | Main Entry                | Additional Exports |
| -------------------- | ------------------------- | ------------------ |
| uxp-devtools-cli     | `./src/uxp.js`            | None (CLI)         |
| uxp-devtools-core    | `./src/index.js`          | None               |
| uxp-devtools-feature | `./src/index.js`          | None               |
| uxp-devtools-helper  | `./src/DevToolsHelper.js` | None               |
| uxp-inspect-frontend | `./main/index.js`         | None               |
| uxp-webdriver        | `./uxp_driver_export.js`  | None               |

---

## 6. File Count Estimate

Files requiring ESM conversion (approximate):

- `packages/uxp-devtools-cli/src/` - ~20 files
- `packages/uxp-devtools-core/src/` - ~40 files
- `packages/uxp-devtools-feature/src/` - ~2 files
- `packages/uxp-devtools-helper/src/` - ~5 files
- `packages/uxp-inspect-frontend/main/` - ~3 files
- `packages/uxp-webdriver/lib/` - ~25 files
- Root scripts - ~3 files

**Total: ~100 JS files** need CommonJS -> ESM conversion

---

## Execution Order

1. pnpm workspace setup (low risk, isolated change)
2. Add .editorconfig (no code changes)
3. ESLint upgrade (can run in parallel with 4)
4. ESM migration (biggest task, do package by package)
5. Add exports fields (after ESM migration)
6. Fix indentation (run `eslint --fix` after config is updated)
