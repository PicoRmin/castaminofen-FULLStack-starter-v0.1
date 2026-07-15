import test from 'node:test';
import assert from 'node:assert/strict';

import { GenericProvider } from '../index';

class StubDownloader {
  public async download(url: string): Promise<string> {
    assert.equal(url, 'https://example.com/feed.xml');
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <link>https://example.com</link>
    <description>Example description</description>
    <language>en</language>
    <item>
      <title>First episode</title>
      <link>https://example.com/episodes/1</link>
      <description>First episode description</description>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;
  }
}

test('rejects unsupported or malformed feed URLs', async () => {
  const provider = new GenericProvider();
  const result = await provider.validate('ftp://example.com/feed.xml');

  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('executes a generic RSS feed through the parser framework', async () => {
  const provider = new GenericProvider({
    downloader: new StubDownloader(),
  });

  const result = await provider.execute('https://example.com/feed.xml');

  assert.equal(result.success, true);
  assert.equal(result.provider, 'generic-rss-provider');
  assert.ok(result.data?.feed);
  assert.ok(Array.isArray(result.data?.episodes));
  assert.equal(result.data?.errors?.length, 0);
});
