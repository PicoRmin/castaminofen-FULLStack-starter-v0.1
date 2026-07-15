# features

This folder holds feature-specific UI and business logic for user-facing capabilities.

## Purpose
- encapsulate distinct product features such as auth, player, search, and profiles
- keep feature logic isolated from other features
- allow feature-level composition of widgets and entities

## Rule
Features should depend on shared and entities layers, not directly on other feature implementations.
