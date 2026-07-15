# Folder Guide

The repository is organized into application code, reusable packages, infrastructure, and documentation.

## Top-level structure
- apps/: delivery surfaces such as web, admin, API, worker, and media services
- packages/: shared platform capabilities reused across apps
- configs/: environment and shared configuration
- database/: schema, migration, and data modeling notes
- deployment/: release and environment deployment guidance
- docs/: architecture, contributor, and product knowledge
- infra/, k8s/, docker/: environment and runtime provisioning
- tests/, tooling/, scripts/: validation and operational workflows

## Contribution rule
Place new features in the most appropriate app or package, and keep cross-cutting concerns in shared packages when they are reused broadly.
