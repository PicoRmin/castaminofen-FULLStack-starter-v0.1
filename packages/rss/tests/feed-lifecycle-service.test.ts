import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FeedLifecycleService,
  getFeedLifecycleStateMachine,
  getFeedLifecycleStateMetadata,
  getFeedLifecycleTransitionRegistry,
} from '../src/lifecycle';

test('allows recovery from disabled state and rejects archived import', () => {
  const service = new FeedLifecycleService();

  const transition = service.transition({
    feedId: 'feed-1',
    currentState: 'DISABLED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Re-enabled by administrator',
    metadata: { source: 'tests' },
  });

  assert.equal(transition.nextState, 'ACTIVE');
  assert.equal(transition.allowed, true);
  assert.equal(service.canImport('ARCHIVED'), false);
  assert.equal(service.canSynchronize('DISABLED'), false);
});

test('exposes a centralized lifecycle registry and state metadata', () => {
  const registry = getFeedLifecycleTransitionRegistry();
  const metadata = getFeedLifecycleStateMetadata('ACTIVE');
  const machine = getFeedLifecycleStateMachine();

  assert.ok(registry.has('ACTIVE'));
  assert.ok(registry.get('ACTIVE')?.includes('SYNCING'));
  assert.equal(metadata?.displayName, 'Active');
  assert.equal(machine.canTransition('DISABLED', 'ACTIVE'), true);
  assert.equal(machine.canTransition('DELETED', 'ACTIVE'), false);
});
