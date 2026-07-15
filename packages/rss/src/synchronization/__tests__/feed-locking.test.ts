import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedConcurrencyController, FeedLeaseManager, FeedLockManager } from '../index';

test('feed lock manager acquires, renews and releases locks deterministically', async () => {
  const lockManager = new FeedLockManager();
  const lock = await lockManager.acquireLock({
    feedId: 'feed-1',
    ownerId: 'owner-a',
    correlationId: 'corr-a',
    policy: { strategy: 'single-feed', ttlMs: 2500, allowSteal: false },
  });

  assert.equal(lock.state, 'Acquired');
  assert.equal(lock.feedId, 'feed-1');
  assert.equal(lock.ownerId, 'owner-a');

  const renewed = await lockManager.renewLock(lock, { ownerId: 'owner-a', ttlMs: 4000 });
  assert.equal(renewed.state, 'Acquired');
  assert.equal(renewed.metadata.renewalCount, 1);

  const released = await lockManager.releaseLock(renewed, { ownerId: 'owner-a' });
  assert.equal(released.state, 'Released');
});

test('feed concurrency controller validates ownership and lease state before execution', async () => {
  const lockManager = new FeedLockManager();
  const leaseManager = new FeedLeaseManager();
  const controller = new FeedConcurrencyController({ lockManager, leaseManager });

  const lock = await lockManager.acquireLock({
    feedId: 'feed-2',
    ownerId: 'owner-b',
    correlationId: 'corr-b',
    policy: { strategy: 'single-feed', ttlMs: 2000, allowSteal: false },
  });

  const lease = leaseManager.createLeaseFromLock(lock, {
    owner: 'owner-b',
    correlationId: 'corr-b',
    ttlMs: 1500,
    metadata: { strategy: 'single-feed' },
  });

  const decision = await controller.authorizeExecution({
    lock,
    lease,
    ownerId: 'owner-b',
    feedId: 'feed-2',
    correlationId: 'corr-b',
    strategyId: 'single-feed',
    ttlMs: 1500,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.lock?.state, 'Acquired');
  assert.equal(decision.lease?.owner, 'owner-b');
});
