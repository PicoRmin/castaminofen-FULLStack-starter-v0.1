# Phase 2: Migration Plan - Complete File Change List

**Objective:** Transform TypeScript monorepo from mixed resolution strategies to unified workspace-based architecture with proper project references.

**Total files to modify:** 35+

---

## Migration Strategy Overview

### Architecture After Migration

```
tsconfig.base.json (root config, NO paths)
  ↓
packages/*/tsconfig.json (composite: true, references to dependencies)
  ↓
apps/*/tsconfig.json (composite: true/false depending on type, references to dependencies)
  ↓
Workspace resolution: pnpm workspace:* → node_modules resolution
```

### Key Changes by Category

1. **Remove all path aliases** — All apps stop using custom paths
2. **Add project references** — Every package/app declares dependencies
3. **Fix rootDir and include** — Correct scope violations
4. **Fix package.json exports** — All packages export dist/, not src/
5. **Adjust Next.js configs** — composite: false for Next.js apps

---

## Category 1: tsconfig.json Files - Packages (26 files)

### Template After Migration

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"],
  "references": [
    // REQUIRED: List of all workspace dependencies
  ]
}
```

### Files Requiring Changes

#### Group A: Add References Only (most packages)

**Change Type:** ADD "references" array matching workspace dependencies

**Packages in this group:**

- `packages/types/tsconfig.json` (NO dependencies, empty references: [])
- `packages/core/tsconfig.json` (references: [types])
- `packages/config/tsconfig.json` (references: [types])
- `packages/logger/tsconfig.json` (references: [types])
- `packages/utils/tsconfig.json` (references: [types])
- `packages/i18n/tsconfig.json` (references: [types])
- `packages/events/tsconfig.json` (references: [types])
- `packages/observability/tsconfig.json` (references: [types])
- `packages/analytics/tsconfig.json` (references: [types])
- `packages/permissions/tsconfig.json` (references: [types])
- `packages/feature-flags/tsconfig.json` (references: [types])
- `packages/eventing/tsconfig.json` (references: [types])
- `packages/search/tsconfig.json` (references: [types])
- `packages/storage/tsconfig.json` (references: [types])
- `packages/testing/tsconfig.json` (references: [types])
- `packages/notifications/tsconfig.json` (references: [types])
- `packages/media/tsconfig.json` (references: [types, core])
- `packages/media-sdk/tsconfig.json` (references: [types, media])
- `packages/player/tsconfig.json` (references: [types, media])
- `packages/auth/tsconfig.json` (references: [types, core])
- `packages/database/tsconfig.json` (references: [types, core])
- `packages/design-system/tsconfig.json` (references: [types, ui])

#### Group B: Add References + Fix Structure

**packages/ui/tsconfig.json**

- **Change Type:** ADD references, ADD include for tsx files
- **Reason:** UI package uses React TSX, needs proper includes
- **Changes:**
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": "src",
      "outDir": "dist",
      "composite": true,
      "declarationMap": true
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "exclude": ["dist", "node_modules"],
    "references": [{ "path": "../../packages/types" }]
  }
  ```

#### Group C: Add References + Update Include

**packages/sdk/tsconfig.json**

- **Change Type:** ADD references
- **Current:** (similar to other packages)
- **Changes:** Add references array based on dependencies

#### Group D: Special Cases - Check for Missing

For each package, verify:

- ✓ rootDir is "src"
- ✓ outDir is "dist"
- ✓ composite is true
- ✓ include pattern is ["src/**/*.ts"] or includes tsx for React packages
- ✓ exclude has ["dist", "node_modules"]

---

## Category 2: tsconfig.json Files - Apps (7 files)

### Group A: Node.js/NestJS Backends

**Template:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"],
  "references": [
    // List dependencies here
  ]
}
```

#### apps/api/tsconfig.json

- **Current problem:** Has custom path aliases to packages/*/src/
- **Change type:** REPLACE completely
- **Changes:**
  1. Remove "baseUrl": "."
  2. Remove "paths" object entirely
  3. Remove excludes for specific files (app.ts, index.ts, spec/test)
  4. Add "references" array
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": "src",
      "outDir": "dist",
      "composite": true,
      "declarationMap": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "strictPropertyInitialization": false
    },
    "include": ["src/**/*.ts"],
    "exclude": ["dist", "node_modules"],
    "references": [
      { "path": "../../packages/core" },
      { "path": "../../packages/config" },
      { "path": "../../packages/logger" },
      { "path": "../../packages/auth" },
      { "path": "../../packages/media" }
    ]
  }
  ```

#### apps/realtime/tsconfig.json

- **Current problem:** Has custom path aliases
- **Change type:** REPLACE
- **Changes:**
  1. Remove "baseUrl": "../../"
  2. Remove "paths" object
  3. Add appropriate "references"
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": "src",
      "outDir": "dist",
      "composite": true,
      "declarationMap": true
    },
    "include": ["src/**/*.ts"],
    "exclude": ["dist", "node_modules"],
    "references": [
      { "path": "../../packages/logger" },
      { "path": "../../packages/config" },
      { "path": "../../packages/core" }
    ]
  }
  ```

#### apps/docs/tsconfig.json

- **Current:** Clean, just needs references
- **Change type:** ADD references
- **Note:** Analyze package.json to determine dependencies

#### apps/media/tsconfig.json

- **Current:** Clean, just needs references
- **Change type:** ADD references
- **Note:** Analyze package.json to determine dependencies

#### apps/worker/tsconfig.json

- **Current problem:** rootDir="../..", includes other packages source
- **Change type:** REPLACE completely (CRITICAL FIX)
- **Changes:**
  1. Change "rootDir": "../.." to "rootDir": "src"
  2. Remove include of packages/_/src/\**/_.ts entirely
  3. Remove "baseUrl" override
  4. Remove "paths" completely
  5. Add references for dependencies
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": "src",
      "outDir": "dist",
      "composite": true,
      "declarationMap": true
    },
    "include": ["src/**/*.ts"],
    "exclude": ["dist", "node_modules"],
    "references": [{ "path": "../../packages/logger" }, { "path": "../../packages/types" }]
  }
  ```

### Group B: Next.js Apps (composite: false)

**Template:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist",
    "composite": false,
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["dist", "node_modules", ".next"],
  "references": []
}
```

**Reasoning for Next.js apps:**

- `composite: false` because Next.js doesn't emit declaration files
- `noEmit: true` because Next.js handles compilation
- `references: []` empty because apps don't have dependents
- No "references" array needed because these are leaf nodes

#### apps/admin/tsconfig.json

- **Current:** rootDir=".", composite: true (WRONG composite value)
- **Change type:** UPDATE composite to false
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": ".",
      "outDir": "dist",
      "composite": false, // Changed from true
      "declarationMap": true,
      "jsx": "preserve",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "allowSyntheticDefaultImports": true,
      "allowJs": true,
      "noEmit": true,
      "incremental": true,
      "isolatedModules": true,
      "plugins": [{ "name": "next" }]
    },
    "include": ["src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["dist", "node_modules", ".next"],
    "references": []
  }
  ```

#### apps/web/tsconfig.json

- **Current:** rootDir=".", composite: true (WRONG composite value)
- **Change type:** UPDATE composite to false
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": ".",
      "outDir": "dist",
      "composite": false, // Changed from true
      "declarationMap": true,
      "jsx": "preserve",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "noEmit": true,
      "incremental": true,
      "isolatedModules": true,
      "plugins": [{ "name": "next" }]
    },
    "include": ["src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["dist", "node_modules"],
    "references": []
  }
  ```

---

## Category 3: Base tsconfig.json Configuration

### tsconfig.base.json

- **Current:** Already correct (baseUrl: ".", paths: {})
- **Change type:** ADD documentation comment
- **Reason:** Clarify that paths are intentionally empty for workspace resolution
- **Changes:**
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "jsx": "react-jsx",
      "strict": true,
      "skipLibCheck": true,
      "declaration": true,
      "sourceMap": true,
      "baseUrl": ".",
      "paths": {
        // ⚠️ IMPORTANT: Do NOT add paths here. Path aliases violate workspace architecture.
        // All internal packages must be resolved through workspace:* dependencies in package.json
        // See ARCHITECTURE_REPORT_PHASE_1.md for rationale.
      },
      "ignoreDeprecations": "5.0",
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true
    },
    "exclude": ["dist", "node_modules"]
  }
  ```

---

## Category 4: package.json Files - All Packages (26+ files)

### Change Type: Fix "exports" Field Consistency

#### Group A: Already Correct

These packages already have proper dist/ exports. Just verify no changes needed:

- `packages/core/package.json`
- `packages/logger/package.json`
- `packages/config/package.json`
- `packages/types/package.json` (has exports field already)
- `packages/media/package.json` (has exports field already)
- [All others except packages/ui]

**Verification checklist for each:**

- [ ] "main": "dist/index.js"
- [ ] "types": "dist/index.d.ts"
- [ ] "exports" field exists (optional but good to add)

#### Group B: Need Exports Field Added

For packages that lack "exports" field, add it:

**Template:**

```json
{
  "name": "@castaminofen/PACKAGE_NAME",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  ...
}
```

**Apply to all packages except:**

- packages/ui (see below)
- packages/types (already has exports)
- packages/media (already has exports)

#### Group C: CRITICAL FIX - packages/ui/package.json

- **Current:** main: "src/index.ts", types: "src/index.ts", exports: "./src/index.ts"
- **Change type:** REPLACE all export references
- **Reason:** Must export built dist files, not source
- **Changes:**
  ```json
  {
    "name": "@castaminofen/ui",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    },
    "scripts": {
      "build": "tsc -p tsconfig.json",
      "lint": "eslint . --ext .ts",
      "test": "echo \"No tests yet\""
    },
    "dependencies": {
      "@castaminofen/types": "workspace:*",
      "@radix-ui/react-dropdown-menu": "^2.1.0",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "react": "^19.1.0",
      "react-dom": "^19.1.0",
      "tailwind-merge": "^2.4.1"
    },
    "devDependencies": {
      "@types/node": "^22.10.1",
      "@types/react": "^19.2.17",
      "@types/react-dom": "^19.2.3",
      "eslint": "^9.14.0",
      "typescript": "^5.6.3"
    }
  }
  ```

---

## Category 5: Build Output Validation

### Expected State After Migration

#### For Every Package

- ✓ `dist/index.js` — compiled ES module
- ✓ `dist/index.d.ts` — TypeScript declarations
- ✓ `dist/index.js.map` — source map
- ✓ `dist/index.d.ts.map` — declaration source map
- ✓ `.tsbuildinfo` file — for incremental builds

#### Validation Command

```bash
find packages/*/dist -type f | head -20
```

Should show structure like:

```
packages/core/dist/index.js
packages/core/dist/index.d.ts
packages/core/dist/index.js.map
packages/core/dist/index.d.ts.map
packages/core/dist/tsbuildinfo
...
```

---

## Summary of File Changes

### Files to Modify: 35+

**tsconfig.json files:** 33

- 26 packages/*/tsconfig.json — Add references, update UI include
- 7 apps/*/tsconfig.json — Remove paths, add references, fix Next.js composite
- 1 tsconfig.base.json — Add documentation comment

**package.json files:** 26+

- All packages — Add "exports" field or update
- packages/ui — CRITICAL FIX: change main/types/exports from src to dist

---

## Pre-Migration Checklist

- [ ] Backup current state (git commit)
- [ ] Read full Phase 1 report
- [ ] Understand project reference syntax
- [ ] Verify all workspace dependencies in package.json
- [ ] Verify all packages have proper index.ts entry points

---

## Post-Migration Validation Checklist

Will be used in Phase 4:

- [ ] `pnpm install` succeeds without warnings
- [ ] `pnpm build` succeeds (all packages)
- [ ] `turbo run build` succeeds
- [ ] `tsc --build` succeeds locally
- [ ] No TypeScript TS2307 errors
- [ ] No TypeScript TS6059 errors
- [ ] No TypeScript TS6307 errors
- [ ] All dist/ folders created
- [ ] All .d.ts files generated
- [ ] All source maps generated

---

## Next Steps

Proceed to **Phase 3: Apply All Changes** which will systematically modify every file listed above.
