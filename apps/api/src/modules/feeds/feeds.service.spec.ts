import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedsService } from './feeds.service';

test('create reuses an existing feed registration for the same rss url', async () => {
  const existingRecord = {
    id: 'feed-1',
    title: 'Existing Feed',
    slug: 'existing-feed',
    rssUrl: 'https://example.com/feed.xml',
    websiteUrl: 'https://example.com',
    syncStatus: 'PENDING',
    isActive: true,
    channelId: 'channel-1',
    status: 'draft',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastSyncAt: null,
  };

  const prisma = {
    podcast: {
      findFirst: async () => existingRecord,
      create: async () => {
        throw new Error('should not create a duplicate record');
      },
    },
    channel: {
      findFirst: async () => ({ id: 'channel-1' }),
      create: async () => ({ id: 'channel-1' }),
    },
  };

  const service = new FeedsService(prisma as any);
  const result = await service.create({ url: 'https://example.com/feed.xml' } as any, 'user-1');

  assert.equal(result.id, 'feed-1');
  assert.equal(result.title, 'Existing Feed');
});
