# Infrastructure

This folder contains adapters for persistence, messaging, storage, and external integrations.

## Purpose
- implement interfaces defined in the domain and application layers
- isolate third-party systems behind adapters
- keep modules free from infrastructure coupling

## What belongs here
- database adapters
- external API clients
- queue and event bus implementations
- storage integrations
