export interface SynchronizationFixture {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly xml: string;
  readonly expectedEpisodes: number;
  readonly format: 'rss' | 'atom' | 'xml';
  readonly metadata?: Record<string, unknown>;
}

const smallRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Small RSS</title>
    <link>https://example.com</link>
    <description>Small feed</description>
    <item>
      <title>Episode One</title>
      <link>https://example.com/episode-1</link>
      <description>One</description>
      <guid>guid-1</guid>
    </item>
  </channel>
</rss>`;

const duplicateEpisodeRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Duplicate RSS</title>
    <link>https://example.com</link>
    <description>Duplicate feed</description>
    <item>
      <title>Episode One</title>
      <link>https://example.com/episode-1</link>
      <description>One</description>
      <guid>guid-1</guid>
    </item>
    <item>
      <title>Episode One</title>
      <link>https://example.com/episode-1</link>
      <description>One</description>
      <guid>guid-1</guid>
    </item>
  </channel>
</rss>`;

const largeRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Large RSS</title>
    <link>https://example.com</link>
    <description>Large feed</description>
    ${Array.from({ length: 12 }, (_, index) => `
      <item>
        <title>Episode ${index + 1}</title>
        <link>https://example.com/episode-${index + 1}</link>
        <description>Episode ${index + 1}</description>
        <guid>guid-${index + 1}</guid>
      </item>`).join('')}
  </channel>
</rss>`;

const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Broken Feed</title>
    <item>
      <title>Broken Item</title>
      <description>Missing closing tag
`;

const podcastNamespaceRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/NS/1.0">
  <channel>
    <title>Podcast Namespace RSS</title>
    <link>https://example.com</link>
    <description>Podcast namespace feed</description>
    <item>
      <title>Podcast Episode</title>
      <link>https://example.com/podcast-episode</link>
      <description>Podcast episode</description>
      <guid>podcast-guid</guid>
      <podcast:explicit>true</podcast:explicit>
    </item>
  </channel>
</rss>`;

export const synchronizationFixtures: readonly SynchronizationFixture[] = [
  {
    id: 'small-rss',
    name: 'Small RSS',
    purpose: 'Baseline synchronization flow with one episode.',
    xml: smallRss,
    expectedEpisodes: 1,
    format: 'rss',
    metadata: { provider: 'generic-rss-provider' },
  },
  {
    id: 'duplicate-rss',
    name: 'Duplicate RSS',
    purpose: 'Duplicate episodes should be skipped during import.',
    xml: duplicateEpisodeRss,
    expectedEpisodes: 2,
    format: 'rss',
  },
  {
    id: 'large-rss',
    name: 'Large RSS',
    purpose: 'Stress smoke fixture with a dozen episodes.',
    xml: largeRss,
    expectedEpisodes: 12,
    format: 'rss',
  },
  {
    id: 'malformed-xml',
    name: 'Malformed XML',
    purpose: 'Broken XML should surface validation errors.',
    xml: malformedXml,
    expectedEpisodes: 0,
    format: 'xml',
  },
  {
    id: 'podcast-namespace-rss',
    name: 'Podcast Namespace RSS',
    purpose: 'Namespace-aware feed should be accepted.',
    xml: podcastNamespaceRss,
    expectedEpisodes: 1,
    format: 'rss',
  },
];

export function getSynchronizationFixture(id: string): SynchronizationFixture {
  const fixture = synchronizationFixtures.find((candidate) => candidate.id === id);
  if (!fixture) {
    throw new Error(`Unknown synchronization fixture: ${id}`);
  }
  return fixture;
}
