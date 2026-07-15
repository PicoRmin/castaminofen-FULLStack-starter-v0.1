import assert from 'node:assert/strict';
import test from 'node:test';

import { FeedLifecycleService } from '../src/lifecycle';

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
