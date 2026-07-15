import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedStateManager } from '../../src/synchronization/state/feed-state-manager';
import { FeedStateMachine } from '../../src/synchronization/state-machine/feed-state-machine';
import { FeedCheckpointManager } from '../../src/synchronization/checkpoints/feed-checkpoint-manager';
import { FeedLockManager } from '../../src/synchronization/locking/feed-lock-manager';
import { SynchronizationRecoveryEngine } from '../../src/synchronization/recovery';
import { DefaultFeedHealthScoringEngine } from '../../src/health/scoring/default-feed-health-scoring-engine';
import { DefaultFeedHealthClassificationEngine } from '../../src/health/classification/default-feed-health-classification-engine';
import { FeedHealthEvaluator } from '../../src/health/evaluation/feed-health-evaluator';

test('unit: state machine transitions and checkpoint lifecycle remain deterministic', async () => {
  const stateManager = new FeedStateManager({ stateMachine: new FeedStateMachine() });
  const state = stateManager.createState('feed-unit');
  const next = stateManager.updateState(state, 'Pending', { reason: 'starting' });
  const checkpoint = new FeedCheckpointManager().createCheckpoint(next, { feedHash: 'hash-1' });

  assert.equal(next.currentState, 'Pending');
  assert.equal(next.currentVersion, 2);
  assert.equal(checkpoint.feedId, 'feed-unit');
  assert.equal(checkpoint.valid, true);
});

test('unit: lock lifecycle supports acquire, renew, expiry and release', async () => {
  const lockManager = new FeedLockManager();
  const lock = await lockManager.acquireLock({ feedId: 'feed-lock', ownerId: 'owner-a', policy: { strategy: 'single-feed', ttlMs: 2500, allowSteal: false } });
  const renewed = await lockManager.renewLock(lock, { ownerId: 'owner-a', ttlMs: 5000 });
  const expired = await lockManager.expireLock(renewed, renewed.expiresAt + 1);
  const released = await lockManager.releaseLock(expired, { ownerId: 'owner-a' });

  assert.equal(lock.state, 'Acquired');
  assert.equal(renewed.metadata.renewalCount, 1);
  assert.equal(expired.state, 'Expired');
  assert.equal(released.state, 'Released');
});

test('unit: recovery engine recommends resume-from-checkpoint for timeout failures', async () => {
  const engine = new SynchronizationRecoveryEngine();
  const plan = await engine.evaluateFailure({
    feedId: 'feed-recovery',
    failure: new Error('ETIMEDOUT while downloading feed'),
    attempt: 1,
    maxRetries: 3,
    metadata: { source: 'unit' },
  });

  assert.equal(plan.recoveryAction, 'resume-from-checkpoint');
  assert.equal(plan.failureClassification.kind, 'timeout');
  assert.equal(plan.retryDecision.allowed, true);
});

test('unit: health scoring and classification remain stable', async () => {
  const evaluator = new FeedHealthEvaluator({
    scoringEngine: new DefaultFeedHealthScoringEngine(),
    classificationEngine: new DefaultFeedHealthClassificationEngine(),
  });

  const health = await evaluator.evaluate({
    feedId: 'feed-health',
    evaluatedAt: new Date('2026-07-15T00:00:00.000Z'),
    metrics: {
      successRate: 0.98,
      failureRate: 0.02,
      averageSyncDurationMs: 1000,
      averageDownloadTimeMs: 450,
      averageImportTimeMs: 120,
      checkpointAgeMs: 30000,
      feedFreshnessMs: 60000,
      episodeGrowth: 2,
      synchronizationFrequency: 3,
      metadataChanges: 0,
      providerAvailability: 0.99,
    },
    metadata: { provider: 'mock-provider' },
  });

  assert.equal(health.status, 'Healthy');
  assert.ok(health.score >= 80);
});
