import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canSynchronize,
  getFeedStatusMetadata,
  isTerminalFeedStatus,
  isValidFeedStatus,
  mapLegacyFeedStatus,
  normalizeFeedStatus,
} from '../index';

test('normalizes canonical and legacy feed statuses', () => {
  assert.equal(normalizeFeedStatus('active'), 'ACTIVE');
  assert.equal(normalizeFeedStatus('draft'), 'NEW');
  assert.equal(normalizeFeedStatus('failed'), 'SYNC_FAILED');
  assert.equal(mapLegacyFeedStatus('archived'), 'ARCHIVED');
});

test('centralizes validation and metadata for feed statuses', () => {
  assert.equal(isValidFeedStatus('READY'), true);
  assert.equal(isValidFeedStatus('unknown'), false);
  assert.equal(isTerminalFeedStatus('DELETED'), true);
  assert.equal(canSynchronize('ACTIVE'), true);
  assert.equal(canSynchronize('VALIDATION_FAILED'), false);

  const metadata = getFeedStatusMetadata('ACTIVE');
  assert.ok(metadata);
  assert.equal(metadata?.displayName, 'Active');
  assert.equal(metadata?.allowsSynchronization, true);
});
