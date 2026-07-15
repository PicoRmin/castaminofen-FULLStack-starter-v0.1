export const DefaultTimeout = 30000;

export const DefaultUserAgent = 'castaminofen-rss/0.1.0';

export const SupportedMimeTypes = [
  'application/rss+xml',
  'application/atom+xml',
  'application/xml',
  'text/xml',
] as const;

export const SupportedXmlFormats = ['rss', 'atom', 'xml'] as const;

export const DefaultRetryCount = 3;
