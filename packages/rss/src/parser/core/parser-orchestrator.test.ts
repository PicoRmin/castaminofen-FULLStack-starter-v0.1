import test from 'node:test';
import { strict as assert } from 'node:assert';
import { ParserFactory } from './parser-factory';
import { ParserRegistry } from './parser-registry';
import { RssParser } from '../rss';
import { AtomParser } from '../atom';

const rssSample = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <link>https://example.com</link>
    <description>desc</description>
    <item>
      <title>Item 1</title>
      <link>https://example.com/item-1</link>
      <description>desc</description>
    </item>
  </channel>
</rss>`;

const atomSample = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>urn:test:feed</id>
  <title>Example Atom Feed</title>
  <updated>2003-12-13T18:30:02Z</updated>
  <entry>
    <id>urn:test:entry</id>
    <title>Entry</title>
    <updated>2003-12-13T18:30:02Z</updated>
  </entry>
</feed>`;

test('ParserFactory selects RSS parser and returns a unified ParseResult', async () => {
  const registry = new ParserRegistry();
  registry.register(new RssParser());
  registry.register(new AtomParser());

  const factory = new ParserFactory(registry);
  const result = await factory.parse(rssSample);

  assert.equal(result.success, true);
  assert.equal(result.metadata?.parserName, 'RssParser');
  assert.equal(result.feed?.title, 'Example Feed');
  assert.equal(result.episodes?.length, 1);
  assert.equal(result.errors.length, 0);
});

test('ParserFactory returns structured errors for unsupported feeds', async () => {
  const registry = new ParserRegistry();
  registry.register(new RssParser());
  registry.register(new AtomParser());

  const factory = new ParserFactory(registry);
  const result = await factory.parse('<html><body>unsupported</body></html>');

  assert.equal(result.success, false);
  assert.equal(result.errors[0]?.code, 'UNSUPPORTED_FEED');
  assert.equal(result.errors[0]?.category, 'parser');
  assert.ok(result.metadata?.diagnostics?.selectedParser === 'none');
});

test('ParserFactory selects Atom parser based on namespace', async () => {
  const registry = new ParserRegistry();
  registry.register(new RssParser());
  registry.register(new AtomParser());

  const factory = new ParserFactory(registry);
  const result = await factory.parse(atomSample);

  assert.equal(result.success, true);
  assert.equal(result.metadata?.parserName, 'AtomParser');
  assert.equal(result.feed?.title, 'Example Atom Feed');
  assert.equal(result.episodes?.length, 1);
});
