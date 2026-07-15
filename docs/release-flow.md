# Release Flow

## Semantic Versioning
- use SemVer: MAJOR.MINOR.PATCH
- increment MAJOR for breaking changes
- increment MINOR for new backward-compatible features
- increment PATCH for bug fixes

## Conventional Commits
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `chore:` for maintenance
- `refactor:` for internal refactoring
- `perf:` for performance improvements
- `test:` for tests

## Branch Strategy
- `main` for production-ready code
- `develop` for integration
- `feature/*` for new work
- `release/*` for release preparation
- `hotfix/*` for urgent fixes

## PR Process
- open a PR against `develop` or `main` depending on scope
- require CI checks before merge
- use the PR template for consistency
