import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonPayloadSerializer } from '../serializers/json-payload-serializer';
import { QueueRegistry } from '../registry/queue-registry';
import { QueueFactory } from '../factory/queue-factory';
import { QueueJobBuilder } from '../builders/queue-job-builder';
import { createQueueConfiguration } from '../configuration/queue-configuration';
import type { QueueAdapter } from '../interfaces/queue-adapter';
import type { QueueDefinition } from '../types/queue-definition';

class InMemoryAdapter implements QueueAdapter<QueueDefinition> {
  public readonly name = 'memory';
  public readonly createdQueues = new Map<string, QueueDefinition>();

  public async createQueue(definition: QueueDefinition): Promise<QueueDefinition> {
    this.createdQueues.set(definition.name, definition);
    return definition;
  }

  public async getQueue(name: string): Promise<QueueDefinition | undefined> {
    return this.createdQueues.get(name);
  }

  public async enqueue(): Promise<string> {
    return 'queued';
  }

  public async close(): Promise<void> {
    this.createdQueues.clear();
  }
}

test('payload serializer preserves versioned payloads and supports backward compatibility', () => {
  const serializer = new JsonPayloadSerializer();
  const payload = { source: 'rss', items: [{ id: '1' }] };

  const encoded = serializer.serialize(payload, { version: 2, compatibilityMode: true });
  assert.equal(encoded.version, 2);
  assert.ok(typeof encoded.payload === 'object' && encoded.payload !== null && 'source' in encoded.payload);
  assert.equal((encoded.payload as { source: string }).source, 'rss');

  const decoded = serializer.deserialize(encoded);
  assert.deepEqual(decoded.payload, payload);
  assert.equal(decoded.version, 2);
});

test('queue registry resolves queue definitions and factory caches adapters', async () => {
  const registry = new QueueRegistry();
  const importDefinition: QueueDefinition = {
    name: 'import',
    kind: 'import',
    description: 'Import queue',
    config: createQueueConfiguration({ queueName: 'import', prefix: 'rss' }),
  };
  const syncDefinition: QueueDefinition = {
    name: 'synchronization',
    kind: 'synchronization',
    description: 'Synchronization queue',
    config: createQueueConfiguration({ queueName: 'synchronization', prefix: 'rss' }),
  };

  registry.register(importDefinition);
  registry.register(syncDefinition);

  const adapter = new InMemoryAdapter();
  const factory = new QueueFactory({ registry, adapter });

  const first = await factory.createQueue('import');
  const second = await factory.createQueue('import');

  assert.equal(first.name, 'import');
  assert.equal(second.name, 'import');
  assert.equal(factory.getQueue('import')?.name, 'import');
  assert.equal(adapter.createdQueues.size, 1);
});

test('job builder creates immutable jobs with metadata and retry defaults', () => {
  const job = new QueueJobBuilder()
    .withJobType('import')
    .withFeedId('feed-1')
    .withCorrelationId('corr-1')
    .withPayload({ url: 'https://example.com/feed.xml' })
    .build();

  assert.equal(job.jobType, 'import');
  assert.equal(job.feedId, 'feed-1');
  assert.equal(job.correlationId, 'corr-1');
  assert.equal(job.state, 'created');
  assert.equal(job.retryPolicy.attempts, 3);
  assert.equal(job.metadata.source, 'queue-builder');
});
