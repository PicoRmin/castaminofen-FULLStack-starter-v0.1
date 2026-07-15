import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FeedLifecycleService,
  evaluateTransitionGuards,
  validateTransitionRequest,
} from '../src/lifecycle';

test('validates a standard lifecycle transition through the centralized framework', () => {
  const result = validateTransitionRequest({
    feedId: 'feed-1',
    currentState: 'DISABLED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Re-enable feed',
  });

  assert.equal(result.success, true);
  assert.equal(result.identifier, 'lifecycle.transition.validation');
  assert.equal(result.category, 'lifecycle');
  assert.equal(result.context.request.targetState, 'ACTIVE');
});

test('blocks terminal-state transitions through the guard framework', () => {
  const guardResult = evaluateTransitionGuards({
    feedId: 'feed-2',
    currentState: 'DELETED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Restore deleted feed',
  });

  assert.equal(guardResult.allowed, false);
  assert.equal(guardResult.guardId, 'lifecycle.terminal-state');
  assert.match(guardResult.reason, /terminal/i);
});

test('service transition uses the centralized framework before execution', () => {
  const service = new FeedLifecycleService();

  const transition = service.transition({
    feedId: 'feed-3',
    currentState: 'READY',
    targetState: 'ACTIVE',
    actor: 'system',
    reason: 'Activate feed',
  });

  assert.equal(transition.allowed, true);
  assert.equal(transition.nextState, 'ACTIVE');
});
