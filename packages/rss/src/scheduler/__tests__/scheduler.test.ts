import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedScheduler, SchedulerRegistry, SchedulerFactory, SchedulerRuntime, ManualTrigger, CronTrigger, FixedIntervalPolicy } from '../index';

test('scheduler runtime can register and evaluate a manual trigger', async () => {
  const registry = new SchedulerRegistry();
  const runtime = new SchedulerRuntime({
    registry,
    queueAdapter: {
      name: 'test-queue',
      createQueue: async () => ({ name: 'test-queue' }),
      getQueue: async () => ({ name: 'test-queue' }),
      enqueue: async () => 'job-1',
      close: async () => undefined,
    },
  });

  const scheduler = new FeedScheduler({
    id: 'scheduler-1',
    name: 'feed-scheduler',
    queueAdapter: runtime.getQueueAdapter(),
  });

  const trigger = new ManualTrigger({
    id: 'trigger-1',
    name: 'manual-trigger',
    feedId: 'feed-1',
    triggerType: 'manual',
    payload: { reason: 'test' },
  });

  runtime.registerScheduler(scheduler);
  runtime.registerTrigger(trigger);

  const context = await runtime.evaluateTrigger('trigger-1');
  assert.equal(context.triggerId, 'trigger-1');
  assert.equal(context.scheduleName, 'manual-trigger');
  assert.equal(context.feedId, 'feed-1');

  const dispatched = await runtime.dispatchTrigger('trigger-1');
  assert.equal(dispatched, true);
});

test('factory and registry expose built-in policies', () => {
  const registry = new SchedulerRegistry();
  const factory = new SchedulerFactory({ registry });
  const policy = factory.createPolicy('fixed-interval', { intervalMs: 1000 });
  assert.ok(policy instanceof FixedIntervalPolicy);
  assert.equal(policy.id, 'fixed-interval');
});
