import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedStateManager } from '../state/feed-state-manager';
import { FeedCheckpointManager } from '../checkpoints/feed-checkpoint-manager';
import { SynchronizationRecoveryEngine } from '../recovery';

test('recovery engine classifies timeout failures and recommends resume-from-checkpoint', async () => {
  const feedStateManager = new FeedStateManager();
  const checkpointManager = new FeedCheckpointManager();
  const engine = new SynchronizationRecoveryEngine({
    feedStateManager,
    checkpointManager,
  });

  const state = feedStateManager.createState('feed-recovery');
  const checkpoint = checkpointManager.createCheckpoint(state, { snapshotHash: 'snap-1' });
  const plan = await engine.evaluateFailure({
    feedId: 'feed-recovery',
    checkpointId: checkpoint.id,
    failure: new Error('ETIMEDOUT while downloading feed'),
    state,
    checkpoint,
    attempt: 1,
    maxRetries: 3,
    metadata: { source: 'test' },
  });

  assert.equal(plan.recoveryAction, 'resume-from-checkpoint');
  assert.equal(plan.failureClassification.kind, 'timeout');
  assert.equal(plan.retryDecision.allowed, true);
  assert.equal(plan.retryDecision.retryCount, 1);
  assert.equal(plan.retryDecision.maxRetries, 3);
  assert.equal(plan.retryDecision.delayMs, 100);
  assert.equal(plan.checkpointReference, checkpoint.id);
  assert.equal(plan.warnings.length >= 1, true);
});
