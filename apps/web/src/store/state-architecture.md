# State Architecture

## Recommended state model
- server state: React Server Components, server data fetching, and cache
- client state: Zustand or Redux Toolkit for shared UI state
- feature state: local state inside feature containers when scoped
- form state: React Hook Form with validation layers

## Separation rules
- UI state stays close to the component or feature that owns it
- shared state is moved to the store layer
- business logic is not embedded directly in presentation components
