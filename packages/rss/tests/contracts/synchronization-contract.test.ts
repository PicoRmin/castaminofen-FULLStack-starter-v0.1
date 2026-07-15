import test from 'node:test';
import assert from 'node:assert/strict';
import { ImportService } from '../../src/import/service';
import { SynchronizationEngine } from '../../src/synchronization/core/synchronization-engine';
import { MockResolver, InMemoryFeedRepository, InMemoryEpisodeRepository, MockStateStore, MockPersistenceCoordinator } from '../mocks/synchronization-mocks';

test('contract: import service and synchronization engine expose the expected public contract surface', async () => {
  const importService = new ImportService({
    resolver: new MockResolver('small-rss'),
    feedRepository: new InMemoryFeedRepository(),
    episodeRepository: new InMemoryEpisodeRepository(),
  });
  const engine = new SynchronizationEngine({
    importService: importService as never,
    stateStore: new MockStateStore(),
    persistenceCoordinator: new MockPersistenceCoordinator() as never,
  });

  assert.equal(typeof importService.import, 'function');
  assert.equal(typeof engine.synchronize, 'function');

  const result = await importService.import({ feedUrl: 'https://example.com/feed.xml', mode: 'manual' });
  assert.equal(typeof result.success, 'boolean');
  assert.ok(Array.isArray(result.createdEntities));
  assert.ok(Array.isArray(result.warnings));
});
