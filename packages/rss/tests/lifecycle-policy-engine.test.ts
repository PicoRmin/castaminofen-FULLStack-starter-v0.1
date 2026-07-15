import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultTransitionPipeline } from '../src/lifecycle/pipeline';
import {
  createLifecyclePolicyEngine,
  createLifecyclePolicyRegistry,
} from '../src/lifecycle/policy-engine';

test('lifecycle policy engine rejects terminal and recovery violations', () => {
  const engine = createLifecyclePolicyEngine(createLifecyclePolicyRegistry());

  const result = engine.evaluate({
    request: {
      feedId: 'feed-1',
      currentState: 'VALIDATION_FAILED',
      targetState: 'ACTIVE',
      actor: 'admin',
      reason: 'Re-enable after validation failure',
      correlationId: 'corr-001',
    },
    transitionDefinition: undefined,
    fromMetadata: undefined,
    toMetadata: undefined,
    guardResult: undefined,
    validationResult: undefined,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.status, 'rejected');
  assert.match(result.reason, /recovery/i);
  assert.ok(
    result.policyResults.some((policy) => policy.policyId === 'lifecycle.policy.recovery-gating'),
  );
});

test('transition pipeline uses the policy engine before execution', () => {
  const pipeline = createDefaultTransitionPipeline();

  const result = pipeline.execute({
    feedId: 'feed-2',
    currentState: 'DISABLED',
    targetState: 'SYNCING',
    actor: 'admin',
    reason: 'Try to sync a disabled feed',
    correlationId: 'corr-002',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.failure?.code, 'policy-rejection');
  assert.match(result.failure?.message ?? '', /eligible/i);
});
