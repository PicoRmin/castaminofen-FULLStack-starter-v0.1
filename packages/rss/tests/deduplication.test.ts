import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedDeduplicationService } from '../src/deduplication';

test('deduplicates near-identical feeds into an exact duplicate candidate', async () => {
  const service = new FeedDeduplicationService();

  const result = await service.deduplicate([
    {
      id: 'feed-a',
      canonicalUrl: 'https://example.com/feed.xml',
      originalUrl: 'https://example.com/feed.xml',
      resolvedUrl: 'https://example.com/feed.xml',
      websiteUrl: 'https://example.com',
      title: 'Example Feed',
      language: 'en',
      publisher: 'Example Co',
      description: 'Daily updates',
      categories: ['news'],
      artworkUrl: 'https://example.com/artwork.jpg',
      fingerprint: 'abc123',
      identity: {
        primaryKey: 'https://example.com/feed.xml',
        confidence: 0.95,
        canonicalUrl: 'https://example.com/feed.xml',
        normalizedUrl: 'https://example.com/feed.xml',
        signals: [{ type: 'canonical', value: 'https://example.com/feed.xml' }],
      },
    },
    {
      id: 'feed-b',
      canonicalUrl: 'https://example.com/feed.xml',
      originalUrl: 'https://example.com/feed.xml?source=2',
      resolvedUrl: 'https://example.com/feed.xml',
      websiteUrl: 'https://example.com',
      title: 'Example Feed',
      language: 'en',
      publisher: 'Example Co',
      description: 'Daily updates',
      categories: ['news'],
      artworkUrl: 'https://example.com/artwork.jpg',
      fingerprint: 'abc123',
      identity: {
        primaryKey: 'https://example.com/feed.xml',
        confidence: 0.95,
        canonicalUrl: 'https://example.com/feed.xml',
        normalizedUrl: 'https://example.com/feed.xml',
        signals: [{ type: 'canonical', value: 'https://example.com/feed.xml' }],
      },
    },
  ]);

  assert.equal(result.canonicalFeed?.id, 'feed-a');
  assert.equal(result.duplicateCandidates.length, 1);
  assert.equal(result.duplicateCandidates[0]?.classification, 'exact-duplicate');
  assert.ok(result.confidenceScores[0]?.score >= 0.95);
  assert.equal(result.warnings.length, 0);
});
