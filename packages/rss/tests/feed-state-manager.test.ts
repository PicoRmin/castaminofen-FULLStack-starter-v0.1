import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedStateManager, FeedStateMachine, FeedCheckpointManager } from '../src/synchronization';

test('feed state manager creates, updates, checkpoints and snapshots deterministically', async () => {
  const stateStore = {
    load: async () => undefined,
    save: async () => undefined,
  };

  const manager = new FeedStateManager({
    stateStore,
    checkpointManager: new FeedCheckpointManager(),
    stateMachine: new FeedStateMachine(),
  });

  const state = manager.createState('feed-1', 'corr-1', { source: 'test' });
  assert.equal(state.currentState, 'NeverSynced');
  assert.equal(state.currentVersion, 1);

  const updated = manager.updateState(state, 'Pending', { reason: 'queued' });
  assert.equal(updated.currentState, 'Pending');
  assert.equal(updated.previousState, 'NeverSynced');
  assert.equal(updated.history.length, 1);

  const checkpoint = manager.createCheckpoint(updated, { etag: 'etag-1' });
  assert.equal(checkpoint.feedId, 'feed-1');
  assert.equal(checkpoint.version, updated.currentVersion);
  assert.equal(checkpoint.metadata.etag, 'etag-1');

  const snapshot = manager.createSnapshot(updated, checkpoint, { warnings: ['warn'] });
  assert.equal(snapshot.state.currentState, 'Pending');
  assert.equal(snapshot.checkpointReference, checkpoint.id);
  assert.equal(snapshot.metadata.feedId, 'feed-1');
  assert.equal(snapshot.warnings.length, 1);

  const restored = await manager.restoreState('feed-1', { state: updated, checkpoint });
  assert.equal(restored.currentState, 'Pending');
  assert.equal(restored.checkpointReference, checkpoint.id);
});

test('feed state machine rejects invalid transitions with a structured error', () => {
  const machine = new FeedStateMachine();
  assert.throws(() => machine.transition('Completed', 'Pending'), (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }
    assert.match(error.message, /Invalid state transition/i);
    return true;
  });
});
