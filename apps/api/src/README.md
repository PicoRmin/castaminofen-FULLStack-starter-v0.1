# Backend Architecture

This directory contains a NestJS-oriented backend architecture for the platform.

## Structure
- Core: shared foundation and framework abstractions
- Infrastructure: adapters, persistence, integrations, and external services
- Application: use cases, commands, queries, and orchestration logic
- Domain: business entities, rules, and aggregates
- Modules: isolated feature modules with explicit boundaries
- Shared: reusable utilities and cross-cutting concerns
- Common: cross-module conventions, types, and base abstractions
- Config: configuration loading and environment handling

## Architectural rules
- each feature module is isolated and owns its own persistence boundary
- modules do not access another module database directly
- interactions happen through interfaces and contracts
- infrastructure details are hidden behind application/domain abstractions
