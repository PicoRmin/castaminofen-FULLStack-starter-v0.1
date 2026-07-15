import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedsAdministrationService } from './feeds-administration.service';

test('updateFeedMetadata persists supported editable fields', async () => {
  const updates: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];

  const prisma = {
    podcast: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        title: 'Old Title',
        description: null,
        language: null,
        isActive: true,
        status: 'draft',
        syncStatus: 'PENDING',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push({ where, data });
        return {
          id: where.id,
          title: data.title as string,
          description: data.description as string | null,
          language: data.language as string | null,
          isActive: true,
          status: 'draft',
          syncStatus: 'PENDING',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        };
      },
    },
  };

  const service = new FeedsAdministrationService(prisma as any);
  const result = await service.updateFeed('feed-1', {
    displayName: 'Updated Title',
    description: 'Updated description',
    language: 'en',
    category: 'news',
    visibility: 'public',
    tags: ['technology'],
    customSettings: { source: 'admin' },
  } as any);

  assert.equal(result.feedId, 'feed-1');
  assert.equal(result.metadata.displayName, 'Updated Title');
  assert.equal(updates[0]?.data.title, 'Updated Title');
  assert.equal(updates[0]?.data.description, 'Updated description');
  assert.equal(updates[0]?.data.language, 'en');
});
