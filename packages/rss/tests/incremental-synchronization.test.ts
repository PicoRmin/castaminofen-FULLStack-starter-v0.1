import test from 'node:test';
import assert from 'node:assert/strict';
import { IncrementalSynchronizationEngine } from '../src/synchronization/incremental';
import { FeedCheckpointManager } from '../src/synchronization/checkpoints/feed-checkpoint-manager';
import { FeedStateManager } from '../src/synchronization/state/feed-state-manager';

test('skips import and persistence when an unchanged feed is synchronized', async () => {
  const stateManager = new FeedStateManager();
  const checkpointManager = new FeedCheckpointManager();
  const state = stateManager.createState('feed-1', 'corr-1', {
    etag: 'etag-a',
    lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT',
    feedHash: 'feed-hash',
    episodeCount: 1,
  });
  const checkpoint = checkpointManager.createCheckpoint(state, {
    etag: 'etag-a',
    lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT',
    feedHash: 'feed-hash',
    episodeCount: 1,
  });
  const restoredState = await stateManager.restoreState('feed-1', {
    state,
    checkpoint,
    metadata: { correlationId: 'corr-1' },
  });

  const engine = new IncrementalSynchronizationEngine({
    feedStateManager: stateManager,
    checkpointManager,
    state: restoredState,
    importService: {
      import: async () => {
        throw new Error('import service should not be called for unchanged feed');
      },
    },
    persistenceCoordinator: {
      execute: async () => {
        throw new Error('persistence coordinator should not be called for unchanged feed');
      },
    },
    downloader: {
      async download() {
        return {
          ok: true,
          response: {
            status: 304,
            headers: {},
            body: '',
            bodyBuffer: Buffer.from(''),
            encoding: 'identity',
            etag: 'etag-a',
            lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT',
            redirected: false,
            redirectCount: 0,
            requestId: 'req-1',
          },
        };
      },
    },
    comparisonEngine: {
      compare: async () => ({ differences: [], warnings: [], errors: [] }),
    },
    hooks: {
      onStarted: () => undefined,
      onProgress: () => undefined,
      onCompleted: () => undefined,
      onFailed: () => undefined,
      onCancelled: () => undefined,
      onSkipped: () => undefined,
      onStateChanged: () => undefined,
    },
  });

  const result = await engine.synchronize({
    feedId: 'feed-1',
    feedUrl: 'https://example.com/feed.xml',
    mode: 'incremental',
    correlationId: 'corr-1',
    metadata: { provider: 'test' },
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'unchanged');
  assert.equal(result.importResult, undefined);
  assert.equal(result.report?.statistics.createdEpisodes, 0);
  assert.equal(
    result.warnings.some((warning) => warning.code === 'no-change'),
    true,
  );
});
