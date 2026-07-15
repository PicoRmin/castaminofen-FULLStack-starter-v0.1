# API Guide

The platform uses a modular backend structure with a primary API application and supporting services.

## Principles
- Keep APIs explicit and versioned.
- Prefer typed contracts and validation.
- Return consistent error shapes and status codes.
- Use shared auth and permission packages rather than duplicating logic.

## Suggested patterns
- REST for external client-facing routes
- Internal service contracts for cross-module communication
- Event-driven integration where asynchronous processing is appropriate

## Quality checklist
- Document request and response shape changes.
- Validate authentication and authorization behavior.
- Add contract or integration tests when behavior changes.
