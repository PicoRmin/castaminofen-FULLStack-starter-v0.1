# Database Guide

The database layer is treated as a shared platform concern and should evolve through deliberate schema changes.

## Principles
- Keep schema changes versioned and reviewable.
- Prefer migrations over manual edits.
- Use repository and service abstractions rather than direct ad-hoc database access.
- Protect integrity with constraints, indexes, and clear ownership.

## Workflow
1. Update the schema or model definition.
2. Generate or author the migration.
3. Validate the change locally.
4. Document any behavioral or operational impact.
