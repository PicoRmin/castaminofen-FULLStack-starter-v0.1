# استراتژی تست

## 1. سطوح تست

### Unit Tests

- domain entities
- value objects
- use cases
- validators
- pure services

### Integration Tests

- repositories with PostgreSQL
- API endpoints with real app context
- event handlers and workers
- external storage adapters

### e2e Tests

- signup/login
- content publishing
- media playback
- comments and moderation
- creator dashboard flows

## 2. ساختار پوشش

```text
tests/
  unit/
  integration/
  e2e/
  fixtures/
  mocks/
```

## 3. اصول

- تست واقعی رفتار، نه mock-only behavior
- تست‌ها باید با contracts واقعی اجرا شوند
- هر ماژول باید حداقل unit و integration test داشته باشد
- e2e برای مسیرهای بحرانی و user journeys
