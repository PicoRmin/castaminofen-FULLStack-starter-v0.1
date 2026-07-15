# Modules

This folder contains isolated feature modules.

## Purpose
- keep each feature independently owned and maintainable
- prevent cross-module database access
- ensure every module exposes a stable contract

## Module contract
Each feature module should contain:
- Controllers
- Services
- Repositories
- Entities
- DTOs
- Validators
- Events
- Commands
- Queries
- Interfaces
- Mappers
- Policies
- Guards
- Interceptors
- Filters
- Tests
- Factories
- Constants
- Errors
- Specifications
- Value Objects
- Aggregates
- Domain Events

## Rule
Modules should interact through interfaces and events, not by reaching into another module's persistence layer.
