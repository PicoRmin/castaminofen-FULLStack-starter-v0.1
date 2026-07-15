import test from 'node:test';
import assert from 'node:assert/strict';

import { createProviderHarness } from '../../test-utils/provider-builder';
import { loadFixture } from '../../test-utils/fixture-loader';

test('provider parsing stays within acceptable timing thresholds for a small feed', async () => {
  const provider = createProviderHarness({
    responses: [
      {
        status: 200,
        headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
        body: loadFixture('minimal-rss'),
      },
    ],
  });

  const startedAt = process.hrtime.bigint();
  const result = await provider.execute('https://example.com/feed.xml');
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  assert.equal(result.success, true);
  assert.ok(elapsedMs < 250, `Expected parse to stay under 250ms, got ${elapsedMs.toFixed(2)}ms`);
});

test('provider handles a large feed payload without crashing', async () => {
  const largeFeed = createLargeRssFeed(200);
  const provider = createProviderHarness({
    responses: [
      {
        status: 200,
        headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
        body: largeFeed,
      },
    ],
  });

  const result = await provider.execute('https://example.com/feed.xml');
  assert.ok(result.success || (result.data?.errors?.length ?? 0) > 0 || (result.data?.warnings?.length ?? 0) > 0);
  assert.ok(Array.isArray(result.data?.episodes));
});

function createLargeRssFeed(itemCount: number): string {
  const items = Array.from({ length: itemCount }, (_, index) => `<item><title>Item ${index + 1}</title><link>https://example.com/${index + 1}</link><description>Large feed item ${index + 1}</description><guid>guid-${index + 1}</guid></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Large Feed</title><link>https://example.com</link><description>Large feed</description>${items}</channel></rss>`;
}
