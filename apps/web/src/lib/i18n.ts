export const messages = {
  en: {
    home: 'Home',
    search: 'Search',
  },
  fa: {
    home: 'خانه',
    search: 'جستجو',
  },
} as const;

export function getMessage(locale: 'en' | 'fa', key: keyof (typeof messages)['en']) {
  return messages[locale][key];
}
