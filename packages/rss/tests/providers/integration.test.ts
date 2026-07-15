import test from 'node:test';
import assert from 'node:assert/strict';

import { createProviderHarness } from '../../test-utils/provider-builder';
import { loadFixture } from '../../test-utils/fixture-loader';

test('provider integration flow resolves, downloads and parses a feed payload', async () => {
  const provider = createProviderHarness({
    responses: [
      {
        status: 200,
        headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
        body: loadFixture('minimal-rss'),
      },
    ],
  });

  const result = await provider.execute('https://example.com/feed.xml');
  assert.equal(result.success, true);
  assert.equal(result.provider, 'generic-rss-provider');
  assert.ok(result.data?.feed?.title);
  assert.equal(result.data?.episodes?.length, 1);
  assert.equal(result.data?.errors?.length, 0);
});

test('provider integration flow captures validation failure for malformed input', async () => {
  const provider = createProviderHarness({
    responses: [
      {
        status: 200,
        headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
        body: loadFixture('malformed-xml'),
      },
    ],
  });

  const result = await provider.execute('https://example.com/feed.xml');
  assert.equal(result.success, false);
  assert.ok(result.data?.errors && result.data.errors.length > 0);
});
