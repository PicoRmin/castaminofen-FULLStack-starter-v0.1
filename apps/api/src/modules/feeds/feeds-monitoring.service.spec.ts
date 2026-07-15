import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedMonitoringService } from './feeds-monitoring.service';

test('returns health, metrics, and statistics for a known feed', async () => {
  const prisma = {
    podcast: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === 'feed-123') {
          return {
            id: 'feed-123',
            title: 'Example Feed',
            rssUrl: 'https://example.com/feed.xml',
            websiteUrl: 'https://example.com',
            lastSyncAt: new Date('2024-01-01T00:00:00.000Z'),
            isActive: true,
            syncStatus: 'COMPLETED',
          };
        }
        return null;
      },
    },
  };

  const service = new FeedMonitoringService(prisma as never);

  const health = await service.getFeedHealth('feed-123');
  assert.equal(health.feedId, 'feed-123');
  assert.ok(health.healthScore >= 0);
  assert.ok(health.warnings.length >= 0);

  const metrics = await service.getFeedMetrics('feed-123');
  assert.equal(metrics.feedId, 'feed-123');
  assert.ok(metrics.summary.synchronizationCount >= 0);
  assert.ok(metrics.summary.failureCount >= 0);

  const statistics = await service.getFeedStatistics('feed-123');
  assert.equal(statistics.feedId, 'feed-123');
  assert.ok(statistics.summary.totalSynchronizations >= 0);
});
