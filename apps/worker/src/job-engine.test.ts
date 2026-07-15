import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRetryDecision } from './job-engine.js';

test('retries transient failures before the final attempt', () => {
  const decision = resolveRetryDecision({
    attemptsMade: 1,
    maxAttempts: 3,
    error: new Error('temporary outage'),
  });

  assert.equal(decision.shouldRetry, true);
  assert.equal(decision.shouldDeadLetter, false);
  assert.equal(decision.delayMs, 2000);
});

test('sends the job to the dead-letter queue after the final attempt', () => {
  const decision = resolveRetryDecision({
    attemptsMade: 3,
    maxAttempts: 3,
    error: new Error('hard failure'),
  });

  assert.equal(decision.shouldRetry, false);
  assert.equal(decision.shouldDeadLetter, true);
  assert.equal(decision.delayMs, 0);
});
