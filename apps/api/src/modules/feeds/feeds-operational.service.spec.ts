import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedsOperationalService } from './feeds-operational.service';

test('getFeedState returns a normalized response for an existing feed', async () => {
  const prisma = {
    podcast: {
      findUnique: async () => ({
        id: 'feed-1',
        title: 'Example Feed',
        rssUrl: 'https://example.com/feed.xml',
        websiteUrl: 'https://example.com',
        lastSyncAt: new Date('2026-07-15T00:00:00.000Z'),
        isActive: true,
        syncStatus: 'COMPLETED',
      }),
    },
  };

  const service = new FeedsOperationalService(prisma as any);
  const result = await service.getFeedState('feed-1');

  assert.equal(result.feedId, 'feed-1');
  assert.equal(result.currentState, 'NeverSynced');
  assert.equal(result.metadata.source, 'api');
});
