# Phase 1: TypeScript Monorepo Architecture Analysis & Issues Report

**Date:** 2025-07-13  
**Scope:** Complete TypeScript configuration review across 26 packages + 7 apps  
**Objective:** Identify all architectural issues preventing scalable, consistent build system

---

## Executive Summary

The repository currently implements **two incompatible module resolution strategies** that cause TypeScript errors (TS2307, TS6059, TS6307) and prevent proper incremental builds:

- **Strategy A (Source Imports):** ~4 apps use custom `tsconfig.json` path aliases pointing directly to `packages/*/src/`
- **Strategy B (Workspace Resolution):** ~3 apps rely on pnpm workspace package resolution

This mixing prevents:

- ✗ Proper TypeScript project references
- ✗ Incremental builds across packages
- ✗ Consistent build outputs
- ✗ Automatic resolution for new packages
- ✗ Composite build optimization

**No package follows the same export pattern.** Some export `dist/`, one exports `src/`, creating inconsistency in the build graph.

---

## Current Architecture Overview

### Workspace Structure

```
castaminofen-fullstack-starter/
├── apps/          (7 applications)
│   ├── admin/        (Next.js)
│   ├── web/          (Next.js)
│   ├── api/          (NestJS backend)
│   ├── realtime/     (Socket.io)
│   ├── worker/       (BullMQ jobs)
│   ├── docs/         (Docs service)
│   └── media/        (Media service)
├── packages/       (26 feature packages)
│   ├── types/        (Root dependency)
│   ├── core/         (Depends on types)
│   ├── config/       (Depends on types)
│   ├── logger/       (Depends on types)
│   ├── database/     (Depends on core, types)
│   ├── ui/           (⚠️ Special: exports src/)
│   └── [22 more...]
├── prisma/         (Schema & migrations)
├── tsconfig.base.json
├── turbo.json
└── pnpm-workspace.yaml
```

### Build System Stack

- **pnpm:** Workspace resolver with `workspace:*` protocol
- **Turbo:** Task orchestrator (v2.0.0)
- **TypeScript:** 5.6.3, ESNext modules, Bundler resolution
- **Framework diversity:**
  - React 19 + Next.js 15 (admin, web)
  - NestJS 10 (api)
  - tsx for Node.js utilities

---

## Critical Issues Discovered

### ⚠️ ISSUE #1: Mixed Module Resolution Strategies

#### Problem

Different apps use fundamentally different strategies to resolve internal packages:

**Strategy A - Source Path Aliases** (❌ WRONG PATTERN)

```json
// apps/api/tsconfig.json, apps/realtime/tsconfig.json
"paths": {
  "@castaminofen/core": ["../../packages/core/src/index.ts"],
  "@castaminofen/logger": ["../../packages/logger/src/index.ts"],
  "@castaminofen/config": ["../../packages/config/src/index.ts"]
}
```

**Strategy B - Workspace Resolution** (✓ CORRECT PATTERN)

```json
// apps/web/package.json, apps/admin/package.json
"dependencies": {
  "@castaminofen/core": "workspace:*",
  "@castaminofen/logger": "workspace:*"
}
```

#### Why This Breaks Everything

1. **TypeScript compiles source files instead of emitted dist files**
   - Apps bypass the package's build process
   - Changes to packages aren't reflected until manual rebuild
   - No separation of build concerns

2. **Inconsistent module resolution**
   - Some imports resolve to source TypeScript files
   - Others resolve through pnpm workspace protocol
   - TypeScript can't optimize incremental builds
   - Turbo can't properly order build tasks

3. **Prevents Project References**
   - Without consistent resolution, `tsc --build` can't work
   - No type-aware incremental compilation
   - Full recompile on every change

#### Affected Files

- `apps/api/tsconfig.json` — 4 path aliases to packages/*/src/
- `apps/realtime/tsconfig.json` — 3 path aliases to packages/*/src/
- `apps/worker/tsconfig.json` — 2 path aliases + problematic include (see Issue #2)

#### Impact

```
TS2307: Cannot find module '@castaminofen/core'
TS6059: File is not under 'rootDir'
TS6307: Cannot write output file - path issues
```

---

### ⚠️ ISSUE #2: Invalid include Patterns & rootDir Values

#### Problem: apps/worker/tsconfig.json

```json
{
  "compilerOptions": {
    "rootDir": "../..", // ❌ Points to MONOREPO ROOT
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@castaminofen/logger": ["../../packages/logger/src/index.ts"],
      "@castaminofen/types": ["../../packages/types/src/index.ts"]
    }
  },
  "include": [
    "src/**/*.ts",
    "../../packages/logger/src/**/*.ts", // ❌ Includes other packages
    "../../packages/types/src/**/*.ts" // ❌ Includes other packages
  ]
}
```

#### Why This Breaks TypeScript

1. **rootDir points outside app directory**
   - TypeScript expects all included files to be under rootDir
   - Creates impossible output structure
   - Violates composite project assumptions

2. **Direct inclusion of other packages' source**
   - TypeScript tries to compile packages/logger/src/ as part of apps/worker
   - Breaks build isolation
   - Creates circular or conflicting compilation
   - Makes it impossible to use proper project references

3. **Compiler produces wrong output structure**
   - Files from packages/ would be in dist/ at wrong paths
   - Runtime imports break
   - No clear dependency declaration

#### Affected Files

- `apps/worker/tsconfig.json` — rootDir="../..", includes other packages

#### Why It "Worked" Before

This configuration forced TypeScript to compile everything inline. It "worked" but:

- Masked real architectural problems
- Made incremental builds impossible
- Prevented Turbo from optimizing builds
- Created technical debt

---

### ⚠️ ISSUE #3: Inconsistent Package Exports

#### Problem

Packages have inconsistent export strategies:

**Most Packages (✓ CORRECT):**

```json
// packages/core/package.json, packages/logger/package.json, etc.
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

**packages/ui/package.json (❌ WRONG):**

```json
{
  "main": "src/index.ts", // ❌ Points to source
  "types": "src/index.ts", // ❌ Points to source
  "exports": {
    ".": "./src/index.ts" // ❌ Points to source
  }
}
```

#### Why This Breaks Dependency Resolution

1. **Inconsistency breaks assumptions**
   - Apps can't rely on any package having built output
   - Turbo can't verify dist/ exists after build
   - pnpm workspace resolution is ambiguous

2. **Source files exposed in production**
   - TypeScript types leak into bundled code
   - Adds compilation to runtime consumption
   - Makes npm publishing impossible

3. **Prevents proper build validation**
   - Turbo task "outputs": ["dist/**"] assumes all packages build dist/
   - packages/ui breaks this assumption
   - Build cache invalidation becomes unreliable

#### Affected Files

- `packages/ui/package.json` — exports src/ instead of dist/

---

### ⚠️ ISSUE #4: No TypeScript Project References

#### Problem

No package declares dependencies via TypeScript project references:

```json
// ❌ All packages/*/tsconfig.json are missing "references"
// ✗ Correct would be:
{
  "compilerOptions": {
    "composite": true
  },
  "references": [{ "path": "../../packages/types" }, { "path": "../../packages/core" }]
}
```

#### Why This Matters

1. **No build graph**
   - TypeScript doesn't know package dependency order
   - tsc --build can't incrementally compile
   - Full recompile required every time

2. **Composite projects are ineffective**
   - "composite": true is set but unused
   - Project reference support requires explicit "references" array
   - Adding "composite" without "references" has no benefit

3. **Turbo can't verify build correctness**
   - Turbo doesn't validate package reference declarations
   - Can't ensure packages are built before dependents
   - Relies entirely on turbo.json "dependsOn" logic

4. **Can't use tsc --build locally**
   - Developers must rely on Turbo
   - No way to build subset of packages with TypeScript alone
   - Debugging build issues becomes harder

#### Affected Files

- ALL package tsconfigfiles — missing "references" array

---

### ⚠️ ISSUE #5: Next.js Apps Configured as Composite Projects

#### Problem

```json
// apps/web/tsconfig.json, apps/admin/tsconfig.json
{
  "compilerOptions": {
    "composite": true, // ❌ Should be false for Next.js
    "noEmit": true, // ✓ Correct for Next.js
    "jsx": "preserve" // ✓ Correct for Next.js
  }
}
```

#### Why This Is Problematic

1. **Composite + noEmit is contradictory**
   - Composite projects require emitted outputs and declaration files
   - noEmit prevents any output
   - Next.js build (next build) handles TSC, doesn't use these settings

2. **Confuses build system**
   - Turbo sees composite: true, expects .tsbuildinfo files
   - noEmit: true prevents their creation
   - Build cache becomes unreliable

3. **Should be false**
   - Next.js apps don't participate in TypeScript build graph
   - They compile via Next.js build system
   - tsconfig.json is for IDE type checking only

#### Affected Files

- `apps/admin/tsconfig.json`
- `apps/web/tsconfig.json`

---

### ⚠️ ISSUE #6: Base tsconfig.json Has Empty Paths

#### Problem

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {} // ❌ Empty
  }
}
```

#### Why This Matters (Positive Note)

Actually, this is partially correct — the base config has NO paths defined. This is good.

However, it allows child configs to define arbitrary paths, which they do (Issue #1).

**Better approach:** Add a comment explaining this is intentional for workspace resolution.

---

### ⚠️ ISSUE #7: Root app tsconfig rootDir Values

#### Next.js Apps

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "rootDir": "." // ✓ Correct for Next.js (not src/)
  }
}
```

#### Non-Next.js Apps

```json
// apps/api/tsconfig.json
{
  "compilerOptions": {
    "rootDir": "src" // ✓ Correct for Node.js backend
  }
}
```

#### Exceptions

```json
// apps/worker/tsconfig.json
{
  "compilerOptions": {
    "rootDir": "../.." // ❌ WRONG - points outside app
  }
}
```

---

### ⚠️ ISSUE #8: Inconsistent Build Scripts

#### Patterns Found

```json
// Most packages
"scripts": {
  "build": "tsc -p tsconfig.json"
}

// Next.js apps
"scripts": {
  "build": "next build"
}

// Prisma uses custom generation
"scripts": {
  "build": "tsc -p tsconfig.json",
  "generate": "prisma generate"
}
```

#### Problem

- Packages use direct tsc, apps use framework build systems
- No unified error handling
- Turbo sees all "build" tasks the same way
- Can't differentiate between tsc success and error

#### Current Turbo Configuration

```json
// turbo.json
"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist/**", ".next/**"]
}
```

This works because outputs catches both, but it's not explicit.

---

### ⚠️ ISSUE #9: Missing or Incomplete Exports Fields

#### Problem

Most packages lack proper "exports" field:

```json
// packages/core/package.json - ❌ Missing exports
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
  // No "exports" field
}

// packages/types/package.json - ✓ Has exports
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

#### Why This Matters

1. **Missing exports breaks conditional imports**
   - Modern Node.js relies on exports field
   - Without it, can't properly resolve subpaths
   - TypeScript with moduleResolution:"bundler" expects explicit exports

2. **Inconsistent package standards**
   - Some packages have exports, others don't
   - New packages won't know which pattern to follow
   - Makes future migration harder

---

## Dependency Graph Analysis

### Healthy Dependency Structure

```
Level 0 (Roots):
  @castaminofen/types

Level 1 (Depend on types):
  @castaminofen/core → types
  @castaminofen/config → types
  @castaminofen/logger → types
  @castaminofen/utils → types
  @castaminofen/i18n → types
  @castaminofen/events → types

Level 2 (Depend on L1):
  @castaminofen/database → core, types
  @castaminofen/analytics → core, types
  @castaminofen/auth → core, types
  [Most feature packages]

Level 3 (Depend on L2):
  @castaminofen/ui → design-system (design-only)
  @castaminofen/media-sdk → media → core, types
  @castaminofen/design-system → ui → types

Level 4 (Apps - depend on multiple L2):
  @castaminofen/app-web → core, config, logger, ui
  @castaminofen/app-admin → core, config, logger, ui
  @castaminofen/app-api → core, config, logger, auth, database, media
  [other apps]
```

**Assessment:** The logical dependency graph is CLEAN with no cycles.

**Problem:** TypeScript build graph doesn't match logical graph because of issues #1-4.

---

## Turbo Configuration Assessment

### Current turbo.json

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Depends on deps' build
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Assessment

**✓ Good:**

- `"dependsOn": ["^build"]` ensures topological sort
- Outputs catch both traditional and Next.js builds

**✗ Problems:**

- Doesn't validate package references
- Can't catch missing packages in dependsOn
- Task cache based on files, not TypeScript build graph

---

## Current TypeScript Compilation Behavior

### What Happens When You Run `turbo run build`

```
1. Turbo reads turbo.json
2. For each "build" task:
   - Check if cache exists
   - If not, run "tsc -p tsconfig.json" or "next build"

3. For packages:
   - tsc reads tsconfig.json
   - Compiles everything in include[] array
   - Because paths[] are configured, uses those paths
   - Compiles source to dist/

4. For apps (Strategy A):
   - tsc reads custom paths
   - Tries to resolve @castaminofen/* from packages/*/src/
   - These files aren't emitted outputs (source files!)
   - Type checking "works" but builds unreliable dependencies

5. For apps (Strategy B):
   - tsc relies on package.json resolution
   - pnpm resolves @castaminofen/* to package main/types
   - Works, but only because tsc -p doesn't use project references
```

### Why TypeScript Errors Occur

1. **When package source changes but dist/ isn't rebuilt**
   - App using Strategy A imports stale source
   - Strategy B apps import dist, work fine

2. **When TS6059 errors appear**
   - Files outside rootDir are included
   - Example: apps/worker rootDir=../.. includes packages/*/src/

3. **When TS2307 errors appear**
   - paths are defined but packages aren't rebuilt
   - Or when imports don't match any path alias

---

## Issues Summary Table

| Issue                       | Severity     | Files Affected                 | Impact                       | Root Cause                          |
| --------------------------- | ------------ | ------------------------------ | ---------------------------- | ----------------------------------- |
| Mixed Resolution Strategies | **CRITICAL** | api, realtime, worker tsconfig | No proper build graph        | Workarounds instead of design       |
| Invalid include/rootDir     | **CRITICAL** | worker tsconfig                | Compiler errors              | Forced TypeScript to include source |
| Inconsistent Exports        | **HIGH**     | packages/ui                    | Breaks dependency resolution | Source export instead of dist       |
| No Project References       | **HIGH**     | ALL packages                   | No incremental builds        | Never implemented                   |
| Next.js Apps as Composite   | **MEDIUM**   | admin, web tsconfig            | Confuses build system        | Copied patterns from packages       |
| Empty paths in base         | **LOW**      | tsconfig.base.json             | Allows bad practices         | Not enforced                        |
| Inconsistent Exports Field  | **MEDIUM**   | 20+ packages                   | Future npm publishing        | Incomplete standards                |

---

## Requirements for Phase 2 (Migration)

The following requirements must be met for a scalable, production-grade architecture:

### Requirement 1: Single Consistent Module Resolution

- ✓ All apps use workspace: * dependencies
- ✓ No path aliases in any app tsconfig
- ✓ No custom include patterns
- ✓ All imports resolve through package.json

### Requirement 2: Proper Build Outputs

- ✓ All packages emit to dist/
- ✓ All packages export dist/ files (not src/)
- ✓ packages/ui matches other packages
- ✓ .d.ts, .js, and .js.map all present

### Requirement 3: Project References

- ✓ Every package has "references" array
- ✓ References match workspace dependencies
- ✓ No circular references
- ✓ Can run tsc --build locally

### Requirement 4: Correct rootDir Values

- ✓ apps/worker: rootDir="src" (not "../..")
- ✓ Packages: rootDir="src"
- ✓ Next.js apps: rootDir="." (special case)
- ✓ No rootDir pointing outside own directory

### Requirement 5: Clean Composite Configuration

- ✓ Only packages are composite: true
- ✓ Next.js apps: composite: false
- ✓ Regular apps: composite: true with proper references

### Requirement 6: Consistent Package Standards

- ✓ All packages have "main", "types", "exports"
- ✓ Exports field follows modern Node.js pattern
- ✓ All reference dist/index.js and dist/index.d.ts
- ✓ No source files in exports

### Requirement 7: Turbo Validation

- ✓ turbo run build succeeds
- ✓ pnpm install succeeds
- ✓ tsc --build succeeds (locally)
- ✓ No TS2307, TS6059, TS6307 errors

---

## Recommendation

**Do not apply quick fixes.** The current configuration has accumulated workarounds that mask deeper architectural problems.

A complete redesign is necessary because:

1. pnpm workspace resolution is mature and reliable
2. TypeScript project references are standard in monorepos
3. Composite builds require explicit reference declarations
4. Future scaling will break with current architecture

The redesign should:

- Eliminate all path alias workarounds
- Add project references for all packages
- Standardize all package exports
- Fix rootDir and include patterns
- Validate with tsc --build, turbo run build, pnpm install

---

## Next Steps

Proceed to **Phase 2: Migration Plan** which lists exact files to modify and specific changes required.
