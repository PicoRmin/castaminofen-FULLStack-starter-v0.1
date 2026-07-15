# Encryption and Secrets

## Encryption strategy
- encrypt sensitive data at rest where supported
- use AES-256 or equivalent strong encryption for secrets and private material
- encrypt backups and sensitive storage objects
- use key rotation and secret management services

## Secret management
- use environment variable injection or secret managers in production
- never store secrets in source control
- rotate tokens, client secrets, and signing keys regularly

## Data protection
- protect PII and credentials with field-level encryption where necessary
- ensure TLS 1.2+ for all network traffic
- use HSTS and secure cookies
