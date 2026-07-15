# Integration Tests

## Scope
- module-to-module interactions
- database and repository integration
- event bus and queue interactions
- API integration with application services

## Guidelines
- use real infrastructure where practical
- isolate external dependencies with test containers when needed
- validate state changes end-to-end within a bounded scope
