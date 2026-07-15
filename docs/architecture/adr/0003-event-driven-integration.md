# ADR 0003: Event-Driven Integration

## وضعیت

پذیرفته شده

## تصمیم

ارتباط میان ماژول‌ها در سطح داخلی از طریق events و async workflows انجام شود.

## دلیل

- کاهش وابستگی مستقیم
- امکان scale و extensibility
- مناسب برای آینده و workflow orchestration

## پیامدها

- نیاز به outbox pattern
- نیاز به idempotent consumers
- نیاز به versioned event contracts
