import test from 'node:test';
import assert from 'node:assert/strict';
import { ImportService } from '../../src/import/service';
import { SynchronizationEngine } from '../../src/synchronization/core/synchronization-engine';
import { MockResolver, InMemoryFeedRepository, InMemoryEpisodeRepository, MockStateStore, MockPersistenceCoordinator, RecordingEventHook } from '../mocks/synchronization-mocks';
import { getSynchronizationFixture } from '../fixtures/synchronization-fixtures';

test('integration: import service and synchronization engine complete a realistic flow', async () => {
  const fixture = getSynchronizationFixture('small-rss');
  const feedRepository = new InMemoryFeedRepository();
  const episodeRepository = new InMemoryEpisodeRepository();
  const importService = new ImportService({
    resolver: new MockResolver('small-rss'),
    feedRepository,
    episodeRepository,
  });
  const stateStore = new MockStateStore();
  const persistenceCoordinator = new MockPersistenceCoordinator();
  const eventHook = new RecordingEventHook();
  const engine = new SynchronizationEngine({
    importService: importService as never,
    stateStore,
    persistenceCoordinator: persistenceCoordinator as never,
    onEvent: (event) => eventHook.onEvent(event),
  });

  const result = await engine.synchronize({
    feedId: 'feed-integration',
    feedUrl: 'https://example.com/feed.xml',
    mode: 'manual',
    correlationId: 'corr-integration',
    metadata: { fixtureId: fixture.id },
    options: { dryRun: false },
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'completed');
  assert.ok(result.importResult);
  assert.ok(feedRepository.podcasts.length >= 1);
  assert.ok(episodeRepository.episodes.length >= 1);
  assert.ok(eventHook.events.length >= 1);
});
