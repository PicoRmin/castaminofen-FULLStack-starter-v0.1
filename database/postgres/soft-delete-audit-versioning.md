# Soft Delete, Audit Logs, and Versioning

## Soft Delete
- all domain tables should include `deleted_at`
- soft delete should be default behavior for user-facing records
- queries should exclude rows where `deleted_at IS NOT NULL`
- hard deletes should be limited to archival or purge jobs

## Audit Logs
- store immutable change events in `audit.audit_events`
- capture table name, record id, actor id, action, old values, new values, timestamp
- use outbox or event-driven integration to populate downstream systems

## Versioning
- version content and media artifacts as immutable records
- maintain `version` columns on entity tables when historical changes matter
- use `revision` tables for entity snapshots when the object becomes large or highly mutable
