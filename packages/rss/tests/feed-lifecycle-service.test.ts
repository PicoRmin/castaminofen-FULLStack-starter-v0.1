import assert from 'node:assert/strict';
import test from 'node:test';

import {
  type FeedLifecycleAggregate,
  type FeedLifecycleDomainResult,
  type FeedLifecycleRepository,
  FeedLifecycleService,
  createTransitionCommand,
  getAllowedTransitions,
  getFeedLifecycleStateMachine,
  getFeedLifecycleStateMetadata,
  getFeedLifecycleTransitionById,
  getFeedLifecycleTransitionRegistry,
  getRecoveryTransitions,
} from '../src/lifecycle';

test('allows recovery from disabled state and rejects archived import', () => {
  const service = new FeedLifecycleService();

  const transition = service.transition({
    feedId: 'feed-1',
    currentState: 'DISABLED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Re-enabled by administrator',
    metadata: { source: 'tests' },
  });

  assert.equal(transition.nextState, 'ACTIVE');
  assert.equal(transition.allowed, true);
  assert.equal(service.canImport('ARCHIVED'), false);
  assert.equal(service.canSynchronize('DISABLED'), false);
});

test('exposes a centralized lifecycle registry and state metadata', () => {
  const registry = getFeedLifecycleTransitionRegistry();
  const metadata = getFeedLifecycleStateMetadata('ACTIVE');
  const machine = getFeedLifecycleStateMachine();
  const transition = getFeedLifecycleTransitionById('syncing.sync-failed');
  const allowedTransitions = getAllowedTransitions('ACTIVE');
  const recoveryTransitions = getRecoveryTransitions();

  assert.ok(registry.has('ACTIVE'));
  assert.ok(registry.get('ACTIVE')?.some((definition) => definition.to === 'SYNCING'));
  assert.equal(metadata?.displayName, 'Active');
  assert.equal(machine.canTransition('DISABLED', 'ACTIVE'), true);
  assert.equal(machine.canTransition('DELETED', 'ACTIVE'), false);
  assert.equal(transition?.category, 'failure');
  assert.equal(transition?.transitionType, 'failure');
  assert.equal(
    allowedTransitions.some((definition) => definition.id === 'active.syncing'),
    true,
  );
  assert.ok(recoveryTransitions.some((definition) => definition.id === 'sync-failed.active'));
});

test('applies an approved transition through the domain service and persists the aggregate', async () => {
  const service = new FeedLifecycleService();

  class TestAggregate implements FeedLifecycleAggregate {
    constructor(
      public readonly id: string,
      public status: string,
      public version: number,
    ) {}

    applyLifecycleTransition(input: {
      previousState: string;
      nextState: string;
      reason: string;
      actor: string;
      timestamp: number;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    }): void {
      this.status = input.nextState;
      this.version += 1;
    }
  }

  class TestRepository implements FeedLifecycleRepository {
    public saved: FeedLifecycleAggregate[] = [];

    async load(id: string): Promise<FeedLifecycleAggregate | undefined> {
      return this.saved.find((aggregate) => aggregate.id === id);
    }

    async save(aggregate: FeedLifecycleAggregate): Promise<FeedLifecycleAggregate> {
      this.saved = this.saved.filter((entry) => entry.id !== aggregate.id);
      this.saved.push(aggregate);
      return aggregate;
    }
  }

  const aggregate = new TestAggregate('feed-1', 'DISABLED', 1);
  const repository = new TestRepository();
  await repository.save(aggregate);

  const command = createTransitionCommand({
    feedId: 'feed-1',
    currentState: 'DISABLED',
    targetState: 'ACTIVE',
    actor: 'admin',
    reason: 'Re-enabled by administrator',
    metadata: { source: 'tests' },
  });

  const result = await service.applyTransition({
    command,
    aggregate,
    repository,
    plan: {
      executionStrategy: 'sync',
      executionMode: 'sync',
      stages: [],
      dependencies: [],
      executionId: 'plan-1',
      correlationId: command.correlationId,
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.currentState, 'ACTIVE');
  assert.equal(aggregate.status, 'ACTIVE');
  assert.equal(aggregate.version, 2);
  assert.equal(repository.saved[0]?.id, 'feed-1');
  assert.equal(result.previousState, 'DISABLED');
});
