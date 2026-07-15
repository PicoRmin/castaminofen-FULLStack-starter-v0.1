# Developer Guide

This guide provides the day-to-day workflow for working in the monorepo.

## Prerequisites
- Node.js 20+
- pnpm 9+
- Docker for local services

## Common commands
- Install dependencies: `pnpm install`
- Start the workspace: `pnpm dev`
- Build everything: `pnpm build`
- Run tests: `pnpm test`
- Lint the repo: `pnpm lint`

## Working conventions
- Keep changes scoped to a single responsibility.
- Prefer shared packages over duplicate implementations.
- Add or update tests for behavior changes.
- Update documentation when architecture or workflows change.

## Local development flow
1. Create a branch for the work.
2. Implement the change and keep the commit focused.
3. Run relevant tests and linting.
4. Open a pull request with a clear summary and validation steps.
