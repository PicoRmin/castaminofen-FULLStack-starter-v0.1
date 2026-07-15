import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultWorkerRuntime } from '../runtime/default-worker-runtime';
import { DefaultWorkerFactory } from '../runtime/default-worker-factory';
import { InMemoryHandlerRegistry } from '../handlers/in-memory-handler-registry';
import { DefaultJobDispatcher } from '../dispatcher/default-job-dispatcher';
import { createJobContext } from '../context/job-context';
import type { QueueJobEnvelope } from '../../queue/contracts/queue-job-contract';
import { createQueueConfiguration } from '../../queue/configuration/queue-configuration';
import type { WorkerConfiguration } from '../contracts/worker-configuration';

class TestHandler {
  public static readonly kind = 'import';

  public async execute(context: { readonly jobId: string }): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}

test('worker runtime dispatches jobs through the registered handler', async () => {
  const handlerRegistry = new InMemoryHandlerRegistry();
  handlerRegistry.register('import', {
    kind: 'import',
    async execute(context) {
      return { ok: true, jobId: context.jobId };
    },
  });

  const dispatcher = new DefaultJobDispatcher({ handlerRegistry });
  const runtime = new DefaultWorkerRuntime({
    dispatcher,
    configuration: {
      workerId: 'worker-runtime-test',
      queueName: 'import',
      concurrency: 1,
      timeoutMs: 5000,
    } as WorkerConfiguration,
  });

  const job: QueueJobEnvelope = {
    jobId: 'job-1',
    jobType: 'import',
    correlationId: 'corr-1',
    feedId: 'feed-1',
    priority: 'normal',
    queueName: 'import',
    payload: { url: 'https://example.com/feed.xml' },
    metadata: { source: 'test' },
    creationTime: Date.now(),
    retryPolicy: { attempts: 3, backoffMs: 100, maxDelayMs: 1000, strategy: 'fixed' },
    timeoutMs: 5000,
    version: 1,
    state: 'created',
  };

  const context = createJobContext(job, { workerId: 'worker-runtime-test' });
  const result = await runtime.dispatch(context);
  const payload = result.result as { jobId?: string } | undefined;

  assert.equal(result.status, 'completed');
  assert.equal(result.jobId, 'job-1');
  assert.equal(payload?.jobId, 'job-1');
});

test('worker factory creates a runtime for the requested worker kind', async () => {
  const factory = new DefaultWorkerFactory({
    configuration: {
      workerId: 'factory-test',
      queueName: 'synchronization',
      concurrency: 1,
      timeoutMs: 5000,
    } as WorkerConfiguration,
    handlerRegistry: new InMemoryHandlerRegistry(),
  });

  const runtime = await factory.create('synchronization');
  assert.ok(runtime);
  assert.equal(runtime.workerId, 'factory-test');
});

test('job context captures immutable execution metadata', () => {
  const job: QueueJobEnvelope = {
    jobId: 'job-2',
    jobType: 'synchronization',
    correlationId: 'corr-2',
    feedId: 'feed-2',
    priority: 'high',
    queueName: 'synchronization',
    payload: { foo: 'bar' },
    metadata: { source: 'context-test' },
    creationTime: Date.now(),
    retryPolicy: { attempts: 2, backoffMs: 100, maxDelayMs: 500, strategy: 'exponential' },
    timeoutMs: 3000,
    version: 1,
    state: 'queued',
  };

  const context = createJobContext(job, {
    workerId: 'worker-context-test',
    executionId: 'exec-2',
    queueName: 'synchronization',
    config: createQueueConfiguration({ queueName: 'synchronization', prefix: 'rss' }),
  });

  assert.equal(context.jobId, 'job-2');
  assert.equal(context.correlationId, 'corr-2');
  assert.equal(context.feedId, 'feed-2');
  assert.equal(context.workerId, 'worker-context-test');
  assert.equal(context.queueName, 'synchronization');
  assert.equal(context.executionId, 'exec-2');
  assert.equal(context.attempt, 1);
});
