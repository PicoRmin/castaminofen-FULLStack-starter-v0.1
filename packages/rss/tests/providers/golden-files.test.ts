import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFixture } from '../../test-utils/fixture-loader';
import { createProviderHarness } from '../../test-utils/provider-builder';

test('golden fixtures remain stable for a minimal rss sample', async () => {
  const provider = createProviderHarness({
    responses: [{ status: 200, headers: { 'content-type': 'application/rss+xml; charset=utf-8' }, body: loadFixture('minimal-rss') }],
  });

  const result = await provider.execute('https://example.com/feed.xml');
  const feed = result.data?.feed;
  const episode = result.data?.episodes?.[0];

  assert.equal(feed?.title, 'Minimal RSS');
  assert.equal(feed?.description, 'Minimal description');
  assert.equal(episode?.title, 'Episode');
  assert.equal(episode?.link, 'https://example.com/episode');
});
