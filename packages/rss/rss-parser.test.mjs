import test from 'node:test';
import assert from 'node:assert/strict';
import { RssParser } from './dist/parser/rss/index.js';

test('parses a basic RSS 2.0 feed', async () => {
  const parser = new RssParser();
  const result = await parser.parse(`<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Example Feed</title>
        <link>https://example.com</link>
        <description>Example description</description>
        <item>
          <title>First item</title>
          <description><![CDATA[<p>Example</p>]]></description>
          <link>https://example.com/item</link>
          <guid isPermaLink="false">abc123</guid>
          <enclosure url="https://example.com/file.mp3" type="audio/mpeg" length="123" />
        </item>
      </channel>
    </rss>`);

  assert.equal(result.channel.title, 'Example Feed');
  assert.equal(result.items[0]?.title, 'First item');
  assert.equal(result.items[0]?.enclosure?.url, 'https://example.com/file.mp3');
  assert.equal(result.errors.length, 0);
});
