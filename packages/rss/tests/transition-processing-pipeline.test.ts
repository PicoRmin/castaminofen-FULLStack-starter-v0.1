import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDefaultTransitionPipeline,
  type TransitionPipelineContext,
} from '../src/lifecycle/pipeline';

test('default pipeline resolves and validates a supported transition', () => {
  const pipeline = createDefaultTransitionPipeline();

  const result = pipeline.execute({
    feedId: 'feed-1',
    currentState: 'DISABLED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Re-enabled by administrator',
    correlationId: 'corr-001',
    metadata: { source: 'tests' },
  });

  assert.equal(result.status, 'success');
  assert.equal(result.context.request.targetState, 'ACTIVE');
  assert.equal(result.context.resolvedTransition?.id, 'disabled.active');
  assert.equal(result.context.validationResult?.success, true);
  assert.equal(result.context.guardResult?.allowed, true);
  assert.equal(result.context.metadata.executionId?.length, 36);
});

test('default pipeline rejects an unknown transition', () => {
  const pipeline = createDefaultTransitionPipeline();

  const result = pipeline.execute({
    feedId: 'feed-1',
    currentState: 'READY',
    targetState: 'UNKNOWN',
    actor: 'admin',
    reason: 'Unsupported transition',
    correlationId: 'corr-002',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.failure?.code, 'unknown-transition');
  assert.equal(result.context.validationResult?.success, false);
  assert.ok(result.context.validationResult?.reason.includes('No lifecycle transition'));
});
