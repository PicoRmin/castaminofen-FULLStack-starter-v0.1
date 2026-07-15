export interface FeedFixture {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly xml: string;
  readonly expectedWarnings: number;
  readonly expectedErrors: number;
  readonly expectedEpisodes: number;
  readonly format: 'rss' | 'atom' | 'xml';
}

const minimalRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Minimal RSS</title>
    <link>https://example.com</link>
    <description>Minimal description</description>
    <item>
      <title>Episode</title>
      <link>https://example.com/episode</link>
      <description>Episode description</description>
      <guid>guid-1</guid>
    </item>
  </channel>
</rss>`;

const fullRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/NS/1.0">
  <channel>
    <title>Full RSS</title>
    <link>https://example.com</link>
    <description>Full description</description>
    <language>en</language>
    <copyright>Example</copyright>
    <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    <managingEditor>editor@example.com</managingEditor>
    <item>
      <title>Episode One</title>
      <link>https://example.com/e1</link>
      <description>Episode description</description>
      <guid isPermaLink="false">ep1</guid>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      <category>Technology</category>
      <category>News</category>
      <podcast:explicit>true</podcast:explicit>
    </item>
  </channel>
</rss>`;

const minimalAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Minimal Atom</title>
  <id>urn:uuid:1234</id>
  <updated>2024-01-01T00:00:00Z</updated>
  <entry>
    <title>Entry</title>
    <id>urn:uuid:entry-1</id>
    <updated>2024-01-01T00:00:00Z</updated>
    <content>Example</content>
  </entry>
</feed>`;

const fullAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Full Atom</title>
  <id>urn:uuid:feed-1</id>
  <updated>2024-01-01T00:00:00Z</updated>
  <author><name>Example Author</name></author>
  <link href="https://example.com" rel="alternate" />
  <entry>
    <title>Entry One</title>
    <id>urn:uuid:entry-1</id>
    <updated>2024-01-01T00:00:00Z</updated>
    <summary>Summary</summary>
    <content>Body</content>
    <media:group>
      <media:title>Media title</media:title>
    </media:group>
  </entry>
</feed>`;

const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Broken Feed</title>
    <item>
      <title>Broken Item</title>
      <description>Missing closing tag
`;

const malformedRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Malformed RSS</title>
    <item>
      <title>Item</title>
      <description>Desc</description>
      <guid></guid>
    </item>
  </channel>
`;

const malformedAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Malformed Atom</title>
  <id>urn:uuid:feed-1</id>
  <entry>
    <title>Entry</title>
    <id>urn:uuid:entry-1</id>
    <updated>not-a-date</updated>
`;

const unknownNamespaces = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:custom="https://example.com/custom">
  <channel>
    <title>Unknown Namespaces</title>
    <link>https://example.com</link>
    <description>Description</description>
    <item>
      <title>Episode</title>
      <link>https://example.com/episode</link>
      <description>Episode description</description>
      <custom:meta>value</custom:meta>
    </item>
  </channel>
</rss>`;

const compressedFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Compressed Feed</title>
    <link>https://example.com</link>
    <description>Description</description>
    <item>
      <title>Compressed Episode</title>
      <link>https://example.com/episode</link>
      <description>Description</description>
      <guid>guid-c</guid>
    </item>
  </channel>
</rss>`;

export const providerFixtures: readonly FeedFixture[] = [
  {
    id: 'minimal-rss',
    name: 'Minimal RSS',
    purpose: 'Baseline RSS 2.0 parsing with a single item.',
    xml: minimalRss,
    expectedWarnings: 0,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'rss',
  },
  {
    id: 'full-rss',
    name: 'Full RSS',
    purpose: 'RSS feed with custom namespaces and multiple categories.',
    xml: fullRss,
    expectedWarnings: 0,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'rss',
  },
  {
    id: 'minimal-atom',
    name: 'Minimal Atom',
    purpose: 'Baseline Atom parsing with a single entry.',
    xml: minimalAtom,
    expectedWarnings: 0,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'atom',
  },
  {
    id: 'full-atom',
    name: 'Full Atom',
    purpose: 'Atom feed with media namespace and extra metadata.',
    xml: fullAtom,
    expectedWarnings: 0,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'atom',
  },
  {
    id: 'malformed-xml',
    name: 'Malformed XML',
    purpose: 'Broken XML should surface parse errors.',
    xml: malformedXml,
    expectedWarnings: 0,
    expectedErrors: 1,
    expectedEpisodes: 0,
    format: 'xml',
  },
  {
    id: 'malformed-rss',
    name: 'Malformed RSS',
    purpose: 'RSS with an invalid structure should be tolerated as a warning.',
    xml: malformedRss,
    expectedWarnings: 1,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'rss',
  },
  {
    id: 'malformed-atom',
    name: 'Malformed Atom',
    purpose: 'Atom with a bad date should be tolerated with a warning.',
    xml: malformedAtom,
    expectedWarnings: 1,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'atom',
  },
  {
    id: 'unknown-namespaces',
    name: 'Unknown Namespaces',
    purpose: 'Unknown namespaces should not break parsing.',
    xml: unknownNamespaces,
    expectedWarnings: 1,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'rss',
  },
  {
    id: 'compressed-feed',
    name: 'Compressed Feed',
    purpose: 'Compressed payload should be accepted by the network layer.',
    xml: compressedFeed,
    expectedWarnings: 0,
    expectedErrors: 0,
    expectedEpisodes: 1,
    format: 'rss',
  },
];

export function getFixtureById(id: string): FeedFixture | undefined {
  return providerFixtures.find((fixture) => fixture.id === id);
}
