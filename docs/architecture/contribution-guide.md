# راهنمای مشارکت

## 1. اصول مشارکت

- هر تغییر باید با ADR یا مستند مرتبط باشد
- هر ماژول باید boundary و ownership مشخص داشته باشد
- تغییرات باید با تست همراه باشند
- هیچ وابستگی مستقیم بین ماژول‌های غیرمرتبط مجاز نیست

## 2. رویه PR

- branch naming: feature/..., fix/..., chore/...
- PR باید شامل خلاصه، دلیل، و اثر روی معماری باشد
- برای تغییرات معماری، ADR اضافه شود

## 3. استاندارد کدنویسی

- TypeScript strict mode
- eslint و prettier
- no circular dependencies
- no direct DB access from UI
