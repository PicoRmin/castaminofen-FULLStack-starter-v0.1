# store

This folder contains global state architecture for the frontend.

## Purpose
- define state containers for application-wide concerns
- separate UI state from domain state
- support predictable state transitions and hydration

## Recommended approach
- use Zustand or Redux Toolkit for shared client state
- keep async state and server state separate from local UI state
