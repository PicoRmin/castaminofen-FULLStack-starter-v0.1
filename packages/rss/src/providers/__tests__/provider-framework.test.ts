import test from 'node:test';
import assert from 'node:assert/strict';

import { ProviderRegistry } from '../registry';
import { ProviderResolver } from '../resolver';
import { BaseProvider } from '../core';
import type { ProviderContract, ProviderMetadata, ProviderCapability } from '../types';
import { DuplicateProviderError } from '../errors';

class TestProvider extends BaseProvider implements ProviderContract {
  constructor() {
    super({
      id: 'test-provider',
      name: 'Test Provider',
      version: '1.0.0',
      description: 'A test provider for framework validation.',
      priority: 100,
      formats: ['rss'],
      domains: ['example.com', '*.example.org'],
      capabilities: [
        { name: 'rss', enabled: true },
        { name: 'conditional-requests', enabled: true },
      ],
      author: 'Test Team',
      enabled: true,
    });
  }

  public override supports(url: string): boolean {
    return url.includes('example');
  }
}

test('registry registers and resolves providers without duplicate registration', async () => {
  const registry = new ProviderRegistry();
  const provider = new TestProvider();

  registry.register(provider);
  assert.equal(registry.getByIdentifier('test-provider'), provider);
  assert.equal(registry.getAll().length, 1);

  assert.throws(
    () => registry.register(provider),
    (error: unknown) => error instanceof DuplicateProviderError,
  );

  const resolver = new ProviderResolver(registry);
  const result = await resolver.resolve({ url: 'https://example.com/feed.xml' });

  assert.ok(result.provider);
  assert.equal(result.provider?.metadata.id, 'test-provider');
  assert.ok(result.score >= 100);
  assert.ok(result.reasons.length > 0);
});
