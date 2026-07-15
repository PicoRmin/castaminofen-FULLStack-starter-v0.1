# Session and Token Management

## JWT
- access tokens should be short-lived, e.g. 5-15 minutes
- include minimal claims and issuer/audience metadata
- sign tokens with strong asymmetric keys in production
- reject tokens with invalid signatures, expired time, or revoked status

## Refresh tokens
- store refresh tokens hashed in the database
- rotate on each use and revoke on compromise
- bind refresh tokens to device and IP context where possible
- support single-session and multi-session policies

## Session management
- maintain server-side session records for revocation and auditing
- invalidate sessions on password change, logout, suspicious activity, or admin action
- support remote logout and device management
