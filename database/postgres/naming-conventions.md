# Naming Conventions

## Table names
- use lowercase snake_case
- use domain-oriented names
- prefer pluralized names for collections
- examples: `users`, `content_items`, `media_assets`

## Column names
- use lowercase snake_case
- use explicit names: `created_at`, `updated_at`, `deleted_at`
- use `is_` or `has_` for booleans
- use `_id` for foreign keys

## Constraint names
- `pk_<table>`
- `fk_<table>_<column>_<target>`
- `uq_<table>_<column>`
- `ck_<table>_<rule>`

## Index names
- `idx_<table>_<column>`
- `idx_<table>_<column1>_<column2>`
- `idx_<table>_<column>_partial`
