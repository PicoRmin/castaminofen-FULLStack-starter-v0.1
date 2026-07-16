import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedLifecycleAggregateRoot } from '../src/lifecycle/aggregate';

test('updates lifecycle state through the aggregate and preserves invariants', () => {
  const aggregate = new FeedLifecycleAggregateRoot({
    id: 'feed-1',
    status: 'DISABLED',
    version: 1,
    metadata: {
      source: 'tests',
    },
  });

  aggregate.applyLifecycleTransition({
    previousState: 'DISABLED',
    nextState: 'ACTIVE',
    reason: 'Re-enabled by administrator',
    actor: 'admin',
    timestamp: 1_700_000_000_000,
    correlationId: 'corr-1',
    metadata: { source: 'tests' },
  });

  assert.equal(aggregate.status, 'ACTIVE');
  assert.equal(aggregate.currentState, 'ACTIVE');
  assert.equal(aggregate.version, 2);
  assert.equal(aggregate.metadata?.source, 'tests');
  assert.equal(aggregate.snapshot.status, 'ACTIVE');
  assert.equal(aggregate.snapshot.version, 2);
});
