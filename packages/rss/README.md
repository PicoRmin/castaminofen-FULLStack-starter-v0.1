# @castaminofen/rss

## Purpose

This package provides the architectural foundation for reusable RSS-related capabilities across the monorepo. It is intentionally scaffolded as a future-ready abstraction layer for feed import, parsing, synchronization, and provider integration.

## Responsibilities

- Define package-level DTOs, interfaces, enums, constants, errors, and types
- Establish reusable parser, provider, repository, service, validator, and utility abstractions
- Provide placeholder classes and base abstractions for future implementation
- Remain dependency-light and free of business logic

## Architecture

The package follows the repository's existing workspace-package conventions:

- TypeScript with strict mode
- Barrel exports from the package root
- Small, composable abstractions with clear separation of concerns
- No implementation of business logic in this phase

## Folder structure

- constants: package-wide defaults and static values
- dto: data transfer objects
- entities: domain entity placeholders
- enums: package-specific enums
- errors: custom error classes
- interfaces: contracts and abstractions
- parser: parser abstractions and concrete placeholder classes
- providers: provider abstractions and placeholder providers
- repositories: repository interfaces
- services: service interfaces
- strategies: strategy placeholders
- scheduler: scheduler placeholders
- workers: worker placeholders
- types: reusable type aliases and result shapes
- utils: helper placeholders
- validators: validator placeholders
- shared: shared internal abstractions

## Future roadmap

1. Introduce concrete parser implementations for RSS and Atom feeds
2. Add provider-specific adapter classes
3. Define repository and persistence contracts for feed and episode storage
4. Add import and synchronization orchestration services
5. Expand validators and utilities as concrete implementations are introduced
