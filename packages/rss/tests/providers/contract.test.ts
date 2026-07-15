import test from 'node:test';
import assert from 'node:assert/strict';

import { GenericProvider } from '../../src/providers/generic';
import type { ProviderContract } from '../../src/providers/types';

test('generic provider satisfies the provider contract surface', async () => {
  const provider = new GenericProvider() as ProviderContract;

  assert.equal(typeof provider.supports, 'function');
  assert.equal(typeof provider.priority, 'function');
  assert.equal(typeof provider.capabilities, 'function');
  assert.equal(typeof provider.validate, 'function');
  assert.equal(typeof provider.download, 'function');
  assert.equal(typeof provider.parse, 'function');
  assert.equal(typeof provider.initialize, 'function');
  assert.equal(typeof provider.dispose, 'function');

  const validation = await provider.validate?.('https://example.com/feed.xml');
  assert.equal(validation?.valid, true);
  assert.equal(provider.health?.().status, 'ready');
});
