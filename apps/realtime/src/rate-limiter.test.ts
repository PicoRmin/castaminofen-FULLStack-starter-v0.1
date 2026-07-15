import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRateLimiter } from './rate-limiter.js';

test('allows bursts up to the configured limit and blocks the next request', () => {
  const limiter = new InMemoryRateLimiter({ windowMs: 1000, maxRequests: 2 });

  assert.equal(limiter.allow('user-1'), true);
  assert.equal(limiter.allow('user-1'), true);
  assert.equal(limiter.allow('user-1'), false);
});
