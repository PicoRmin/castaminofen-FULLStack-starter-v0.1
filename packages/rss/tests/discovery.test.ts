import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedDiscoveryService } from '../src/discovery';

test('discovers and normalizes a feed without database coupling', async () => {
  const service = new FeedDiscoveryService();

  const result = await service.discover({
    originalUrl: 'https://Example.com/feed/?utm_source=test#fragment',
    resolvedUrl: 'https://example.com/feed/',
    rawContent: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>  Example Feed  </title><link>https://example.com/</link><description>Example description</description><language>en</language><generator>Example Generator</generator><item><title>First item</title><link>https://example.com/item/1</link><description>Item description</description></item></channel></rss>`,
    parserResult: {
      title: 'Example Feed',
      link: 'https://example.com/',
      language: 'en',
      generator: 'Example Generator',
      publisher: 'Example Publisher',
    },
    metadata: {
      websiteUrl: 'https://example.com',
      publisher: 'Example Publisher',
    },
  });

  assert.equal(result.canonicalUrl, 'https://example.com/feed');
  assert.equal(result.normalizedFeed.title, 'Example Feed');
  assert.equal(result.normalizedFeed.language, 'en');
  assert.equal(result.validation.valid, true);
  assert.equal(result.health.status, 'healthy');
  assert.equal(result.identity.primaryKey, 'https://example.com/feed');
  assert.match(result.fingerprint.value, /^[a-f0-9]{64}$/);
});

test('produces deterministic fingerprints and warnings for weak metadata', async () => {
  const service = new FeedDiscoveryService();

  const first = await service.discover({
    originalUrl: 'https://news.example.com/feed',
    rawContent: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>News</title><link>https://news.example.com</link><description>News feed</description><item><title>Item</title><link>https://news.example.com/item</link></item></channel></rss>`,
    parserResult: {
      title: 'News',
      link: 'https://news.example.com',
    },
  });

  const second = await service.discover({
    originalUrl: 'https://news.example.com/feed',
    rawContent: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>News</title><link>https://news.example.com</link><description>News feed</description><item><title>Item</title><link>https://news.example.com/item</link></item></channel></rss>`,
    parserResult: {
      title: 'News',
      link: 'https://news.example.com',
    },
  });

  assert.equal(first.fingerprint.value, second.fingerprint.value);
  assert.ok(first.warnings.some((warning) => warning.code === 'missing-language'));
  assert.equal(first.health.status, 'warning');
});
