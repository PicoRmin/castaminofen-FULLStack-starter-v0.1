# مرور کلی Packages

## 1. packages/ui

- هدف: اجزای پایه‌ی UI مشترک
- مسئولیت: buttons, inputs, cards, layout primitives
- استفاده‌کننده: همه اپ‌های فرانت‌اند
- غیرقابل استفاده برای: لایه‌های domain و infra

## 2. packages/design-system

- هدف: طراحی سیستم یکپارچه
- مسئولیت: theme، tokens، component patterns
- استفاده‌کننده: web و admin
- غیرقابل استفاده برای: backend

## 3. packages/core

- هدف: abstractions و shared contracts
- مسئولیت: errors, result types, ids, pagination
- استفاده‌کننده: همه لایه‌ها
- غیرقابل استفاده برای: UI بدون معماری مناسب

## 4. packages/auth

- هدف: احراز هویت و دسترسی
- مسئولیت: session، token، permission context
- استفاده‌کننده: api، web، admin
- غیرقابل استفاده برای: ماژول‌های کسب‌وکار بدون dependency injection

## 5. packages/database

- هدف: ORM و persistence abstractions
- مسئولیت: Prisma client، migrations، repositories
- استفاده‌کننده: api، worker
- غیرقابل استفاده برای: frontend

## 6. packages/eventing

- هدف: سیستم رویدادها
- مسئولیت: event contracts، outbox، bus
- استفاده‌کننده: ماژول‌های domain و workflow
- غیرقابل استفاده برای: UI

## 7. packages/storage

- هدف: دسترسی به object storage
- مسئولیت: upload/download/sign URLs
- استفاده‌کننده: media و upload
- غیرقابل استفاده برای: presentation layer

## 8. packages/search

- هدف: abstraction برای search engine
- مسئولیت: indexing و query
- استفاده‌کننده: search و discovery
- غیرقابل استفاده برای: domain logic بدون adapter

## 9. packages/notifications

- هدف: notification delivery abstraction
- مسئولیت: templates، channels، preferences
- استفاده‌کننده: notification، auth، communities
- غیرقابل استفاده برای: persistence layer

## 10. packages/permissions

- هدف: RBAC و ABAC
- مسئولیت: policy evaluation
- استفاده‌کننده: admin، creator، moderation
- غیرقابل استفاده برای: low-level infra
