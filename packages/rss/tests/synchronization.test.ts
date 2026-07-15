import test from 'node:test';
import assert from 'node:assert/strict';
import { SynchronizationEngine } from '../src/synchronization';

test('returns an unchanged result for repeated synchronization when the feed fingerprint is unchanged', async () => {
  const importService = {
    import: async () => ({
      success: true,
      createdEntities: [],
      updatedEntities: [],
      skippedEntities: [],
      warnings: [],
      conflicts: [],
      errors: [],
      statistics: {
        createdPodcasts: 0,
        updatedPodcasts: 0,
        createdEpisodes: 0,
        updatedEpisodes: 0,
        skippedEpisodes: 0,
        duplicateCount: 0,
        warningCount: 0,
        errorCount: 0,
        durationMs: 0,
      },
      durationMs: 0,
      providerMetadata: {},
      mode: 'manual',
    }),
  };

  const stateStore = {
    load: async () => ({
      id: 'feed-1',
      feedId: 'feed-1',
      state: 'completed',
      lastFingerprint: 'fingerprint-1',
      lastSyncedAt: Date.now(),
      metadata: {},
      version: 1,
      transitions: [],
    }),
    save: async () => undefined,
  };

  const persistenceCoordinator = {
    execute: async () => ({ success: true, committedEntities: [], updatedEntities: [], skippedEntities: [], failedEntities: [], warnings: [], errors: [], statistics: { totalOperations: 0, successfulOperations: 0, failedOperations: 0, skippedOperations: 0, durationMs: 0, committedEntities: 0, updatedEntities: 0, skippedEntities: 0 }, durationMs: 0 }),
  };

  const engine = new SynchronizationEngine({
    importService,
    stateStore,
    persistenceCoordinator,
  });

  const result = await engine.synchronize({
    feedId: 'feed-1',
    feedUrl: 'https://example.com/feed.xml',
    mode: 'manual',
    correlationId: 'test-1',
    requestedAt: new Date(),
    options: { dryRun: false },
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'unchanged');
  assert.equal(result.statistics.createdEpisodes, 0);
  assert.equal(result.statistics.updatedEpisodes, 0);
});
