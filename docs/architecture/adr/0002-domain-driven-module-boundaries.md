# ADR 0002: Domain-Driven Module Boundaries

## وضعیت

پذیرفته شده

## تصمیم

هر ماژول باید مالک domain خود باشد و از ماژول‌های دیگر فقط از طریق contracts و events استفاده کند.

## دلیل

- کاهش coupling
- افزایش قابلیت جدا سازی
- ساده‌تر شدن نگهداری و تست

## پیامدها

- لایه‌بندی Domain/Application/Infrastructure/Interface الزامی است
- هر ماژول باید Public API و Private API مشخص داشته باشد
