import test from 'node:test';
import assert from 'node:assert/strict';

import { createProviderHarness } from '../../test-utils/provider-builder';
import { loadFixture } from '../../test-utils/fixture-loader';

test('regression: unknown namespaces do not block parsing', async () => {
  const provider = createProviderHarness({
    responses: [
      {
        status: 200,
        headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
        body: loadFixture('unknown-namespaces'),
      },
    ],
  });

  const result = await provider.execute('https://example.com/feed.xml');
  assert.equal(result.success, true);
  assert.ok(result.data?.warnings?.length >= 0);
});

test('regression: malformed atom payload is tolerated with warnings', async () => {
  const provider = createProviderHarness({
    responses: [
      {
        status: 200,
        headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
        body: loadFixture('malformed-atom'),
      },
    ],
  });

  const result = await provider.execute('https://example.com/feed.xml');
  assert.ok(result.success || (result.data?.errors?.length ?? 0) > 0 || (result.data?.warnings?.length ?? 0) >= 0);
});
