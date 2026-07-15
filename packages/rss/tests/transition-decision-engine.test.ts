import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTransitionDecisionEngine,
  type TransitionDecisionContext,
  type TransitionGuardResult,
  type TransitionPolicyResult,
  type TransitionValidationResult,
} from '../src/lifecycle';

function createValidationResult(success: boolean): TransitionValidationResult {
  return {
    success,
    identifier: success ? 'validation.ok' : 'validation.failed',
    category: 'lifecycle',
    reason: success ? 'ok' : 'validation failed',
    code: success ? 'ok' : 'validation-failed',
    metadata: {},
    context: {
      request: {
        feedId: 'feed-1',
        currentState: 'DISABLED',
        targetState: 'ACTIVE',
        actor: 'admin',
        reason: 'test',
      },
    },
  };
}

function createGuardResult(allowed: boolean): TransitionGuardResult {
  return {
    allowed,
    guardId: allowed ? 'guard.ok' : 'guard.blocked',
    transition: 'disabled.active',
    reason: allowed ? 'ok' : 'guard rejected',
    code: allowed ? 'ok' : 'guard-rejected',
    metadata: {},
    context: {
      request: {
        feedId: 'feed-1',
        currentState: 'DISABLED',
        targetState: 'ACTIVE',
        actor: 'admin',
        reason: 'test',
      },
    },
  };
}

function createPolicyResult(status: 'allowed' | 'deferred' | 'rejected'): TransitionPolicyResult {
  return {
    allowed: status === 'allowed',
    status,
    policyId: 'policy.test',
    displayName: 'Test Policy',
    description: 'test',
    category: 'operational',
    priority: 1,
    executionOrder: 1,
    reason: status === 'allowed' ? 'ok' : status === 'deferred' ? 'deferred' : 'rejected',
    code: status === 'allowed' ? 'ok' : status === 'deferred' ? 'deferred' : 'rejected',
    metadata: {},
    failureReason: status === 'allowed' ? undefined : 'blocked',
    retryHint: undefined,
    notificationHint: undefined,
    auditMetadata: undefined,
    loggingMetadata: undefined,
  };
}

test('creates an allow decision when validation, guard, and policy pass', () => {
  const engine = createTransitionDecisionEngine();
  const context: TransitionDecisionContext = {
    request: {
      feedId: 'feed-1',
      currentState: 'DISABLED',
      targetState: 'ACTIVE',
      actor: 'admin',
      reason: 'test',
    },
    executionIdentifier: 'exec-allow',
    correlationIdentifier: 'corr-allow',
    validationResult: createValidationResult(true),
    guardResult: createGuardResult(true),
    policyResult: createPolicyResult('allowed'),
  };

  const decision = engine.evaluate(context);

  assert.equal(decision.decisionType, 'ALLOW');
  assert.equal(decision.decisionCategory, 'aggregation');
  assert.equal(decision.validationSummary.present, true);
  assert.equal(decision.guardSummary.present, true);
  assert.equal(decision.policySummary.present, true);
  assert.equal(decision.failure, undefined);
});

test('rejects the transition when validation fails', () => {
  const engine = createTransitionDecisionEngine();
  const context: TransitionDecisionContext = {
    request: {
      feedId: 'feed-1',
      currentState: 'DISABLED',
      targetState: 'ACTIVE',
      actor: 'admin',
      reason: 'test',
    },
    executionIdentifier: 'exec-reject',
    correlationIdentifier: 'corr-reject',
    validationResult: createValidationResult(false),
    guardResult: createGuardResult(true),
    policyResult: createPolicyResult('allowed'),
  };

  const decision = engine.evaluate(context);

  assert.equal(decision.decisionType, 'REJECT');
  assert.equal(decision.decisionSeverity, 'critical');
  assert.equal(decision.failure?.type, 'DecisionConflict');
});

test('defers the transition when policy evaluation is deferred', () => {
  const engine = createTransitionDecisionEngine();
  const context: TransitionDecisionContext = {
    request: {
      feedId: 'feed-1',
      currentState: 'DISABLED',
      targetState: 'ACTIVE',
      actor: 'admin',
      reason: 'test',
    },
    executionIdentifier: 'exec-defer',
    correlationIdentifier: 'corr-defer',
    validationResult: createValidationResult(true),
    guardResult: createGuardResult(true),
    policyResult: createPolicyResult('deferred'),
  };

  const decision = engine.evaluate(context);

  assert.equal(decision.decisionType, 'DEFER');
  assert.equal(decision.decisionSeverity, 'warning');
  assert.equal(decision.policySummary.status, 'deferred');
});
