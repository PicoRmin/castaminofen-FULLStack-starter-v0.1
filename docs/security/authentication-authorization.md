# Authentication and Authorization

## Authentication strategy
- use Better Auth as the primary authentication layer
- support email/password, OAuth providers, and magic links where appropriate
- issue short-lived JWTs for access and long-lived refresh tokens for renewal
- store refresh tokens securely and rotate them on each use

## Providers
- Google
- GitHub
- Apple
- email/password

## Account lifecycle controls
- require email verification on signup and sensitive changes
- support password reset with signed one-time tokens
- support 2FA with TOTP or WebAuthn where possible
- support device binding and session revocation

## Authorization strategy
- use RBAC with roles such as user, creator, moderator, admin
- use fine-grained permissions for resource-level access
- use feature flags to enable or disable capabilities without code changes
- evaluate permissions centrally through a policy engine
