# راهنمای Packages

## هدف

این پوشه مرجع بسته‌های مشترک و reusable capabilities پروژه است.

## بسته‌های اصلی

- ui
- design-system
- core
- auth
- database
- config
- observability
- eventing
- testing
- i18n
- types
- storage
- search
- media-sdk
- analytics-sdk
- feature-flags
- permissions
- notifications

## قواعد طراحی

- هر package باید یک responsibility مشخص داشته باشد.
- package ها نباید به apps وابسته باشند.
- همه وابستگی‌ها باید از طریق interfaces و abstractions انجام شود.
