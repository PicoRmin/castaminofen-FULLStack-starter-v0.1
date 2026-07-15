import test from 'node:test';
import assert from 'node:assert/strict';
import { SynchronizationEngine } from '../../src/synchronization/core/synchronization-engine';
import { FaultInjectionController, FaultInjectingImportService, MockStateStore, MockPersistenceCoordinator, RecordingEventHook } from '../mocks/synchronization-mocks';

test('resilience: provider failure is captured and returns a structured failure result', async () => {
  const controller = new FaultInjectionController();
  controller.inject('provider-unavailable');
  const importService = new FaultInjectingImportService({
    import: async () => ({ success: true, createdEntities: [], updatedEntities: [], skippedEntities: [], warnings: [], conflicts: [], errors: [], statistics: { createdPodcasts: 0, updatedPodcasts: 0, createdEpisodes: 0, updatedEpisodes: 0, skippedEpisodes: 0, duplicateCount: 0, warningCount: 0, errorCount: 0, durationMs: 0 }, durationMs: 0, providerMetadata: {}, mode: 'manual' }),
  } as never, controller);
  const engine = new SynchronizationEngine({
    importService: importService as never,
    stateStore: new MockStateStore(),
    persistenceCoordinator: new MockPersistenceCoordinator() as never,
    onEvent: (event) => undefined,
  });

  const result = await engine.synchronize({ feedId: 'feed-resilience', feedUrl: 'https://example.com/feed.xml', mode: 'manual', correlationId: 'corr-resilience', options: { dryRun: false } });

  assert.equal(result.success, false);
  assert.ok(result.errors.length >= 1);
});

test('resilience: invalid checkpoint and corrupted state still resolve with warnings', async () => {
  const stateStore = new MockStateStore();
  await stateStore.save({ feedId: 'feed-corrupt', state: 'Failed', metadata: { feedHash: null }, version: 1, transitions: [] });
  const engine = new SynchronizationEngine({
    importService: { import: async () => ({ success: true, createdEntities: [], updatedEntities: [], skippedEntities: [], warnings: [], conflicts: [], errors: [], statistics: { createdPodcasts: 0, updatedPodcasts: 0, createdEpisodes: 0, updatedEpisodes: 0, skippedEpisodes: 0, duplicateCount: 0, warningCount: 0, errorCount: 0, durationMs: 0 }, durationMs: 0, providerMetadata: {}, mode: 'manual' }) },
    stateStore,
    persistenceCoordinator: new MockPersistenceCoordinator() as never,
  });

  const result = await engine.synchronize({ feedId: 'feed-corrupt', feedUrl: 'https://example.com/feed.xml', mode: 'manual', correlationId: 'corr-corrupt', options: { dryRun: false } });

  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.warnings));
});
