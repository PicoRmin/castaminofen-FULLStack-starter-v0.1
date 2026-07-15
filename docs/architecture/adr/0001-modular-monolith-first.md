# ADR 0001: Modular Monolith First

## وضعیت

پذیرفته شده

## تصمیم

در فاز اولیه از Modular Monolith استفاده شود، نه Microservices.

## دلیل

- سرعت توسعه اولیه بالا‌تر است
- هزینه عملیاتی کمتر است
- مرزهای ماژول‌ها واضح و قابل نگهداشت است
- امکان جداسازی در آینده وجود دارد

## پیامدها

- نیاز به strong module boundaries
- نیاز به event-driven communication
- نیاز به واضح‌سازی ownership و contracts
