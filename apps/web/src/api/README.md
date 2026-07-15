# api

This folder contains the frontend API layer.

## Purpose
- centralize HTTP clients and endpoint definitions
- separate transport concerns from UI and business logic
- support caching, retries, and request configuration

## Recommended structure
- client.ts for shared HTTP or fetch setup
- endpoints/ for route-specific API modules
- types/ for API response contracts
