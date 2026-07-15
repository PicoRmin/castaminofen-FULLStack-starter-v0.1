import test from 'node:test';
import { strict as assert } from 'node:assert';
import { AtomParser } from './index';

const sampleAtom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-US" xml:base="http://example.com/">
  <id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>
  <title type="text">Example Feed</title>
  <subtitle type="html">A &lt;em&gt;subtitle&lt;/em&gt;.</subtitle>
  <updated>2003-12-13T18:30:02Z</updated>
  <rights>&copy; 2003 Example.com</rights>
  <generator uri="http://www.example.com/" version="1.0">Example Toolkit</generator>
  <icon>http://example.com/icon.png</icon>
  <logo>http://example.com/logo.png</logo>
  <category term="technology" scheme="http://example.com/categories" label="Technology" />
  <link rel="self" href="http://example.com/feed.atom" />
  <link rel="alternate" type="text/html" href="http://example.com/" />
  <author>
    <name>John Doe</name>
    <uri>http://example.com/john</uri>
    <email>john@example.com</email>
  </author>
  <entry>
    <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
    <title type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>Atom-Powered Robots Run Amok</p></div></title>
    <summary type="text">Some text.</summary>
    <content type="html">&lt;p&gt;This is &lt;strong&gt;content&lt;/strong&gt;.&lt;/p&gt;</content>
    <updated>2003-12-13T18:30:02Z</updated>
    <published>2003-12-13T18:30:02Z</published>
    <author>
      <name>Jane Doe</name>
    </author>
    <link rel="alternate" href="http://example.com/2003/12/13/atom03.html" />
  </entry>
</feed>`;

test('AtomParser parses valid Atom feed', async () => {
  const parser = new AtomParser();
  const result = await parser.parse(sampleAtom);

  assert.equal(result.feed.id, 'urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6');
  assert.equal(result.feed.title?.value, 'Example Feed');
  assert.equal(result.feed.subtitle?.value, 'A <em>subtitle</em>.');
  assert.equal(result.feed.updated, '2003-12-13T18:30:02.000Z');
  assert.equal(result.feed.authors.length, 1);
  assert.equal(result.feed.authors[0]?.name, 'John Doe');
  assert.equal(result.feed.links.length, 2);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0]?.title?.value?.includes('Atom-Powered Robots Run Amok'), true);
  assert.equal(result.entries[0]?.authors[0]?.name, 'Jane Doe');
  assert.equal(result.entries[0]?.links[0]?.href, 'http://example.com/2003/12/13/atom03.html');
  assert.equal(result.errors.length, 0);
});

test('AtomParser returns structured errors for invalid root', async () => {
  const parser = new AtomParser();
  const result = await parser.parse(`<?xml version="1.0"?><rss><channel></channel></rss>`);

  assert.equal(result.feed.id, undefined);
  assert.equal(result.errors.length > 0, true);
  assert.equal(result.errors[0]?.code, 'FeedValidationError');
});
