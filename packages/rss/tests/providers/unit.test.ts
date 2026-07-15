import test from 'node:test';
import assert from 'node:assert/strict';

import { ProviderRegistry } from '../../src/providers/registry';
import { ProviderResolver } from '../../src/providers/resolver';
import { BaseProvider } from '../../src/providers/core';
import type { ProviderContract } from '../../src/providers/types';
import { DuplicateProviderError } from '../../src/providers/errors';
import { GenericProvider } from '../../src/providers/generic';
import { HttpDownloadService, HttpRequestBuilder } from '../../src/network';

class TestProvider extends BaseProvider implements ProviderContract {
  constructor() {
    super({
      id: 'unit-test-provider',
      name: 'Unit Test Provider',
      version: '1.0.0',
      description: 'Provider used for unit verification.',
      priority: 80,
      formats: ['rss'],
      domains: ['example.com'],
      capabilities: [{ name: 'rss', enabled: true }],
      author: 'Test Team',
      enabled: true,
    });
  }

  public override supports(url: string): boolean {
    return url.includes('example.com');
  }
}

test('provider registry stores and rejects duplicate registration', () => {
  const registry = new ProviderRegistry();
  const provider = new TestProvider();

  registry.register(provider);
  assert.equal(registry.getByIdentifier('unit-test-provider'), provider);
  assert.throws(() => registry.register(provider), (error: unknown) => error instanceof DuplicateProviderError);
});

test('provider resolver selects the best matching provider', async () => {
  const registry = new ProviderRegistry();
  registry.register(new TestProvider());

  const resolver = new ProviderResolver(registry);
  const result = await resolver.resolve({ url: 'https://example.com/feed.xml' });

  assert.equal(result.provider?.metadata.id, 'unit-test-provider');
  assert.ok(result.score >= 80);
  assert.ok(result.reasons.length > 0);
});

test('generic provider exposes the expected metadata and capabilities', async () => {
  const provider = new GenericProvider();
  assert.equal(provider.metadata.id, 'generic-rss-provider');
  assert.ok(provider.capabilities().length > 0);
  const health = provider.health();
  assert.equal(health.status, 'ready');
});

test('http request builder and service create normalized requests', async () => {
  const builder = new HttpRequestBuilder();
  const request = builder.setUrl('https://example.com/feed.xml').setMethod('GET').build();
  assert.equal(request.headers.accept, 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*');

  const service = new HttpDownloadService({
    client: {
      async execute(req) {
        return {
          status: 200,
          headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
          body: '<rss />',
          bodyBuffer: Buffer.from('<rss />'),
          encoding: 'identity',
          contentLength: 6,
          contentType: 'application/rss+xml; charset=utf-8',
          etag: '',
          lastModified: '',
          timing: { totalMs: 1 },
          statistics: { downloadedBytes: 6, compressedBytes: 6, decompressedBytes: 6 },
          redirected: false,
          redirectCount: 0,
          requestId: req.id,
        };
      },
    },
    requestBuilder: builder,
  });

  const result = await service.download('https://example.com/feed.xml');
  assert.equal(result.ok, true);
  assert.equal(result.response?.body, '<rss />');
});
