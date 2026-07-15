# services

This folder contains application services that wrap external APIs and domain operations.

## Purpose
- keep business logic out of UI components
- centralize API calls, adapters, and persistence-related coordination
- provide reusable service interfaces for features and modules

## Rule
UI should call services, not directly perform domain logic or network coordination.
