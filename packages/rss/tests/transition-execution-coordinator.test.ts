import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedLifecycleService, TransitionExecutionCoordinator } from '../src/lifecycle';

test('coordinator executes a supported transition through the lifecycle domain service', () => {
  const service = new FeedLifecycleService();
  const coordinator = new TransitionExecutionCoordinator({ lifecycleService: service });

  const result = coordinator.execute({
    feedId: 'feed-1',
    currentState: 'DISABLED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Re-enabled by administrator',
    correlationId: 'corr-coordinator',
    metadata: { source: 'tests' },
  });

  assert.equal(result.status, 'success');
  assert.equal(result.executionResult?.allowed, true);
  assert.equal(result.executionResult?.nextState, 'ACTIVE');
  assert.equal(result.context?.executionId?.length, 36);
});
