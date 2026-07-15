# Prisma Structure

## Suggested Prisma model organization
- prisma/schema.prisma
- prisma/migrations/
- prisma/seed.ts
- prisma/seed-data/

## Core model groups
- auth and identity
- users and creators
- content and media
- engagement and social
- search and analytics
- recommendations and notifications
- audit and versioning

## Prisma conventions
- use singular model names in PascalCase
- use snake_case column names in the database
- use `@@map` for table naming
- use `@@index` for selective indexes
- use `@@unique` for natural uniqueness
- keep relation names explicit and stable
