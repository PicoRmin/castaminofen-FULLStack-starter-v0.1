import assert from 'node:assert/strict';
import test from 'node:test';

import { createTransitionCommand } from '../src/lifecycle/commands';
import { createTransitionDecisionEngine } from '../src/lifecycle/decision-engine';
import { createTransitionExecutionPlanningEngine } from '../src/lifecycle/planning-engine';

test('creates an immutable execution plan for an approved transition', () => {
  const command = createTransitionCommand({
    feedId: 'feed-1',
    currentState: 'Draft',
    targetState: 'Pending',
    correlationId: 'corr-1',
    actor: 'system',
    reason: 'plan the transition',
  });

  const decision = createTransitionDecisionEngine().evaluate({
    request: {
      feedId: 'feed-1',
      currentState: 'Draft',
      targetState: 'Pending',
      correlationId: 'corr-1',
      actor: 'system',
    },
    validationResult: {
      success: true,
      code: 'ok',
      reason: 'ok',
      errors: [],
      warnings: [],
      metadata: {},
    },
    guardResult: {
      allowed: true,
      code: 'ok',
      reason: 'ok',
      metadata: {},
    },
    policyResult: {
      allowed: true,
      status: 'allowed',
      identifier: 'policy',
      reason: 'ok',
      code: 'ok',
      metadata: {},
    },
    executionIdentifier: 'exec-1',
    correlationIdentifier: 'corr-1',
    transitionIdentifier: 'draft.pending',
    sourceState: 'Draft',
    targetState: 'Pending',
  });

  const engine = createTransitionExecutionPlanningEngine();
  const result = engine.plan({
    decision,
    command,
    executionContext: {
      executionId: 'exec-1',
      correlationId: 'corr-1',
      command,
      decision,
      transition: command.transition,
      feed: command.feed,
      repositorySnapshot: { feedId: 'feed-1' },
      configurationSnapshot: { mode: 'test' },
      environment: { name: 'test' },
      featureFlags: { planningEngine: true },
      pipelineMetadata: { stage: 'planning' },
    },
  });

  assert.equal(result.status, 'created');
  assert.equal(result.plan.executionStrategy, 'immediate');
  assert.equal(result.plan.stages[0]?.id, 'pre-validation');
  assert.equal(Object.isFrozen(result.plan), true);
  assert.equal(Object.isFrozen(result.plan.metadata), true);
});

test('defers execution planning when the decision is deferred', () => {
  const command = createTransitionCommand({
    feedId: 'feed-2',
    currentState: 'Pending',
    targetState: 'Archived',
    correlationId: 'corr-2',
    actor: 'system',
    reason: 'defer',
  });

  const engine = createTransitionExecutionPlanningEngine();
  const result = engine.plan({
    decision: {
      decisionId: 'decision-2',
      decisionType: 'DEFER',
      decisionReason: 'deferred by policy',
      decisionCategory: 'policy',
      decisionSeverity: 'warning',
      decisionPriority: 'deferred',
      decisionConfidence: 0.6,
      evaluationTimestamp: '2026-01-01T00:00:00.000Z',
      executionIdentifier: 'exec-2',
      correlationIdentifier: 'corr-2',
      transitionIdentifier: 'pending.archived',
      sourceState: 'Pending',
      targetState: 'Archived',
      validationSummary: { present: true, status: 'passed', code: 'ok', reason: 'ok' },
      guardSummary: { present: true, status: 'passed', code: 'ok', reason: 'ok' },
      policySummary: { present: true, status: 'passed', code: 'ok', reason: 'ok' },
      metadata: {},
      futureRetryMetadata: {},
      futureRecoveryMetadata: {},
      futureNotificationMetadata: {},
      futureAuditMetadata: {},
      futureMetricsMetadata: {},
      futureLoggingMetadata: {},
      failure: undefined,
    },
    command,
    executionContext: {
      executionId: 'exec-2',
      correlationId: 'corr-2',
      command,
      decision: undefined,
      transition: command.transition,
      feed: command.feed,
    },
  });

  assert.equal(result.status, 'deferred');
  assert.equal(result.plan.executionStrategy, 'deferred');
});
