export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  defaultLocale: 'en',
  supportedLocales: ['en', 'fa'] as const,
  themeStorageKey: 'theme',
};
