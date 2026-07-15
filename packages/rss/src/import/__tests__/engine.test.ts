import test from 'node:test';
import assert from 'node:assert/strict';

import { ImportDecisionEngine } from '../deduplication';

test('builds a deterministic import plan for a valid feed', async () => {
  const engine = new ImportDecisionEngine();

  const plan = await engine.createPlan({
    podcast: {
      title: 'Example Podcast',
      feedId: 'feed-001',
      feedUrl: 'https://example.com/feed.xml',
      canonicalUrl: 'https://example.com',
      providerId: 'provider-001',
      language: 'en',
      categories: ['Technology'],
      authors: ['Ada Lovelace'],
      metadata: { source: 'unit-test' },
    },
    episodes: [
      {
        title: 'Example Episode',
        guid: 'ep-001',
        canonicalUrl: 'https://example.com/ep-001',
        mediaUrl: 'https://example.com/audio.mp3',
        publishedAt: '2026-01-01T00:00:00.000Z',
        language: 'en',
        categories: ['Technology'],
        authors: ['Ada Lovelace'],
        metadata: { source: 'unit-test' },
      },
    ],
    metadata: { requestId: 'req-1' },
  });

  assert.equal(plan.decisions.length, 2);
  assert.equal(plan.entitiesToCreate.length, 2);
  assert.equal(plan.entitiesToUpdate.length, 0);
  assert.equal(plan.entitiesToSkip.length, 0);
  assert.equal(plan.rejectedEntities.length, 0);
  assert.ok(plan.decisions.some((decision) => decision.type === 'CreatePodcast'));
  assert.ok(plan.decisions.some((decision) => decision.type === 'CreateEpisode'));
  assert.equal(plan.warnings.length, 0);
});
