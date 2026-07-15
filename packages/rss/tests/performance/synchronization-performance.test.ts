import test from 'node:test';
import assert from 'node:assert/strict';
import { SynchronizationEngine } from '../../src/synchronization/core/synchronization-engine';
import { MockStateStore, MockPersistenceCoordinator } from '../mocks/synchronization-mocks';

test('performance: synchronization smoke path stays within a reasonable duration', async () => {
  const engine = new SynchronizationEngine({
    importService: {
      import: async () => ({ success: true, createdEntities: ['podcast', 'episode'], updatedEntities: [], skippedEntities: [], warnings: [], conflicts: [], errors: [], statistics: { createdPodcasts: 1, updatedPodcasts: 0, createdEpisodes: 1, updatedEpisodes: 0, skippedEpisodes: 0, duplicateCount: 0, warningCount: 0, errorCount: 0, durationMs: 0 }, durationMs: 1, providerMetadata: {}, mode: 'manual' }),
    },
    stateStore: new MockStateStore(),
    persistenceCoordinator: new MockPersistenceCoordinator() as never,
  });

  const startedAt = Date.now();
  const result = await engine.synchronize({ feedId: 'feed-performance', feedUrl: 'https://example.com/feed.xml', mode: 'manual', options: { dryRun: false } });
  const durationMs = Date.now() - startedAt;

  assert.equal(result.success, true);
  assert.ok(durationMs < 500);
});
