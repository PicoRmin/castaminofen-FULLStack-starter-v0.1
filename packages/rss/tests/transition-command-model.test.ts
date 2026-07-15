import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TransitionCommand,
  createTransitionCommand,
  type TransitionCommandSerializable,
} from '../src/lifecycle/commands';

test('creates an immutable canonical transition command from a legacy request', () => {
  const command = createTransitionCommand({
    feedId: 'feed-1',
    currentState: 'READY',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Activated by administrator',
    correlationId: 'corr-1',
    metadata: { source: 'tests' },
  });

  assert.ok(command instanceof TransitionCommand);
  assert.equal(command.feed.id, 'feed-1');
  assert.equal(command.transition.currentState, 'READY');
  assert.equal(command.transition.targetState, 'ACTIVE');
  assert.equal(command.actor.id, 'admin');
  assert.equal(command.executionContext.requestMetadata.source, 'tests');
  assert.equal(command.metadata.custom.source, 'tests');
  assert.equal(Object.isFrozen(command), true);
  assert.equal(Object.isFrozen(command.executionContext), true);
});

test('serializes and restores a transition command without losing structure', () => {
  const command = new TransitionCommand({
    id: 'cmd-100',
    correlationId: 'corr-100',
    causationId: 'cause-100',
    idempotencyKey: 'idem-100',
    requestId: 'req-100',
    executionId: 'exec-100',
    pipelineId: 'pipeline-100',
    traceId: 'trace-100',
    feed: {
      id: 'feed-100',
      slug: 'sample-feed',
      providerIdentifier: 'provider-100',
      repositoryIdentifier: 'repository-100',
    },
    transition: {
      currentState: 'READY',
      targetState: 'ACTIVE',
      identifier: 'ready.active',
      category: 'lifecycle',
      type: 'normal',
      requestedOperation: 'activate',
      requestedAction: 'activate-feed',
    },
    actor: {
      id: 'admin-100',
      type: 'user',
      role: 'administrator',
      requestSource: 'api',
      executionSource: 'worker',
      triggerSource: 'manual',
    },
    executionContext: {
      environment: 'development',
      featureFlags: { dryRun: true },
      configurationSnapshot: { region: 'eu-west' },
      repositorySnapshot: { provider: 'rss' },
      requestMetadata: { source: 'tests' },
      pipelineMetadata: { stage: 'validation' },
    },
    metadata: {
      custom: { source: 'tests' },
      validation: { requiredFields: ['feed.id', 'transition.targetState'] },
    },
  });

  const serialized = command.toJSON();
  const restored = TransitionCommand.fromJSON(serialized as TransitionCommandSerializable);

  assert.equal(restored.id, 'cmd-100');
  assert.equal(restored.feed.slug, 'sample-feed');
  assert.equal(restored.transition.identifier, 'ready.active');
  assert.deepEqual(restored.metadata.validation?.requiredFields, [
    'feed.id',
    'transition.targetState',
  ]);
});
