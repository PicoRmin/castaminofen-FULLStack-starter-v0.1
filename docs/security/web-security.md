# Web Security Controls

## CSRF
- enforce CSRF protection for cookie-based auth flows
- use SameSite cookies and CSRF tokens for state-changing requests

## CORS
- allow only explicit origins and methods
- do not allow wildcard origins for authenticated APIs
- keep credentials policy strict

## Helmet
- enable Helmet defaults in the API layer
- set appropriate content security policies and frame protections

## XSS prevention
- escape output by default
- use content security policy and strict sanitization for rich text
- avoid inline scripts and unsafe inline styles

## SQL injection prevention
- use parameterized queries only
- avoid string-built SQL
- use Prisma or an ORM-safe query layer

## Rate limiting
- apply per-user, per-IP, and per-route rate limits
- use Redis-backed distributed rate limiting
- protect login, password reset, and public write endpoints
