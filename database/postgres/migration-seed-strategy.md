# Migration and Seed Strategy

## Migration strategy
- use Prisma Migrate for schema changes
- keep migrations small and reversible
- separate structural changes from data backfills
- use transaction-safe migrations for high-risk changes
- do not mix formatting changes with logical schema changes

## Seed strategy
- seed only reference and development data in local and test environments
- keep production seeds minimal or empty
- seed through idempotent scripts
- use factories and deterministic values for test environments

## Rollout strategy
- deploy schema changes with backward-compatible migration order
- phase risky changes behind feature flags when necessary
