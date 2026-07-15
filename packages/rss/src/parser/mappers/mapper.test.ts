import test from 'node:test';
import assert from 'node:assert/strict';
import { DtoMapper } from './mapper';

test('DtoMapper normalizes feed and episode models into DTOs', () => {
  const mapper = new DtoMapper();
  const feedDto = mapper.mapFeed({
    id: ' 42 ',
    title: ' Example Feed ',
    description: '  A feed  ',
    link: ' https://example.com/feed ',
    language: ' EN ',
    copyright: '  Example  ',
    updatedAt: '2024-01-02T03:04:05Z',
    generator: ' test ',
    categories: [{ term: ' tech ', label: ' Tech ' }],
    authors: [{ name: ' Jane ', email: ' jane@example.com ', uri: ' https://example.com/jane ' }],
    image: {
      url: ' https://example.com/image.png ',
      title: ' Image ',
      link: ' https://example.com ',
    },
    links: [
      {
        href: ' https://example.com/rss ',
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'RSS',
      },
    ],
    episodes: [
      {
        id: ' episode-1 ',
        title: ' Episode 1 ',
        description: ' Desc ',
        link: ' https://example.com/ep1 ',
        publishedAt: '2024-01-01T00:00:00Z',
        authors: [{ name: ' John ' }],
        categories: [{ term: ' news ' }],
        explicit: true,
        mediaUrl: ' https://example.com/audio.mp3 ',
        metadata: {
          unknownNamespaces: [],
          unknownElements: ['custom:thing'],
          unknownAttributes: ['custom:attr'],
          custom: { provider: 'demo' },
        },
      },
    ],
    metadata: {
      unknownNamespaces: [],
      unknownElements: ['custom:thing'],
      unknownAttributes: ['custom:attr'],
      custom: { provider: 'demo' },
    },
  });

  const feed = feedDto as any;
  assert.equal(feed.title, 'Example Feed');
  assert.equal(feed.link, 'https://example.com/feed');
  assert.equal(feed.language, 'en');
  assert.equal(feed.updatedAt, '2024-01-02T03:04:05.000Z');
  assert.equal(feed.categories[0]?.term, 'tech');
  assert.equal(feed.authors[0]?.name, 'Jane');
  assert.equal(feed.episodes[0]?.title, 'Episode 1');
  assert.equal(feed.episodes[0]?.explicit, true);
  assert.equal(feed.metadata.custom.provider, 'demo');
});
