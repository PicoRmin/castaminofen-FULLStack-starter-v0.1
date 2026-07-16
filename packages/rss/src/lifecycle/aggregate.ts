import { normalizeFeedStatus } from '../status';
import { FeedLifecycleViolationError } from './errors';
import { getFeedLifecycleStateMachine } from './registry';
import type {
  FeedLifecycleAggregate,
  FeedLifecycleAggregateMutation,
  FeedLifecycleAggregateSnapshot,
  FeedLifecycleDomainEvent,
  FeedLifecycleState,
} from './types';

export interface FeedLifecycleAggregateIdentity {
  readonly id: string;
  readonly slug?: string | null;
  readonly providerId?: string | null;
  readonly repositoryId?: string | null;
  readonly tenantId?: string | null;
}

export interface FeedLifecycleAggregateRootInput {
  readonly id: string;
  readonly status?: FeedLifecycleState | string;
  readonly version?: number;
  readonly metadata?: Record<string, unknown>;
  readonly lifecycleMetadata?: Record<string, unknown>;
  readonly operationalMetadata?: Record<string, unknown>;
  readonly synchronizationMetadata?: Record<string, unknown>;
  readonly configurationSnapshot?: Record<string, unknown>;
  readonly subscriptionMetadata?: Record<string, unknown>;
  readonly regionalMetadata?: Record<string, unknown>;
  readonly identity?: FeedLifecycleAggregateIdentity;
  readonly createdAt?: number;
  readonly updatedAt?: number;
}

export class FeedLifecycleAggregateRoot implements FeedLifecycleAggregate {
  public readonly id: string;
  public readonly identity: FeedLifecycleAggregateIdentity;
  public readonly createdAt: number;
  public updatedAt: number;
  public status: FeedLifecycleState;
  public state: FeedLifecycleState;
  public currentState: FeedLifecycleState;
  public lifecycleState: FeedLifecycleState;
  public version: number;
  public metadata: Record<string, unknown>;
  public lifecycleMetadata: Record<string, unknown>;
  public operationalMetadata: Record<string, unknown>;
  public synchronizationMetadata: Record<string, unknown>;
  public configurationSnapshot: Record<string, unknown>;
  public subscriptionMetadata: Record<string, unknown>;
  public regionalMetadata: Record<string, unknown>;
  private _snapshot: FeedLifecycleAggregateSnapshot;
  private readonly events: FeedLifecycleDomainEvent[] = [];

  constructor(input: FeedLifecycleAggregateRootInput) {
    const normalizedId = input.id?.trim();
    if (!normalizedId) {
      throw new FeedLifecycleViolationError('Aggregate id is required', {
        code: 'aggregate-id-required',
      });
    }

    const initialState = normalizeFeedStatus(input.status ?? 'NEW') as FeedLifecycleState;
    const initialVersion = Math.max(1, input.version ?? 1);

    this.id = normalizedId;
    this.identity = {
      id: normalizedId,
      slug: input.identity?.slug ?? null,
      providerId: input.identity?.providerId ?? null,
      repositoryId: input.identity?.repositoryId ?? null,
      tenantId: input.identity?.tenantId ?? null,
    };
    this.createdAt = input.createdAt ?? Date.now();
    this.updatedAt = input.updatedAt ?? this.createdAt;
    this.status = initialState;
    this.state = initialState;
    this.currentState = initialState;
    this.lifecycleState = initialState;
    this.version = initialVersion;
    this.metadata = { ...(input.metadata ?? {}) };
    this.lifecycleMetadata = { ...(input.lifecycleMetadata ?? {}) };
    this.operationalMetadata = { ...(input.operationalMetadata ?? {}) };
    this.synchronizationMetadata = { ...(input.synchronizationMetadata ?? {}) };
    this.configurationSnapshot = { ...(input.configurationSnapshot ?? {}) };
    this.subscriptionMetadata = { ...(input.subscriptionMetadata ?? {}) };
    this.regionalMetadata = { ...(input.regionalMetadata ?? {}) };
    this._snapshot = this.createSnapshot();
  }

  public get snapshot(): FeedLifecycleAggregateSnapshot {
    return this._snapshot;
  }

  public getDomainEvents(): readonly FeedLifecycleDomainEvent[] {
    return [...this.events];
  }

  public applyLifecycleTransition(input: FeedLifecycleAggregateMutation): void {
    const previousState = normalizeFeedStatus(input.previousState) as FeedLifecycleState;
    const nextState = normalizeFeedStatus(input.nextState) as FeedLifecycleState;

    if (this.currentState !== previousState) {
      throw new FeedLifecycleViolationError(
        `Aggregate state ${this.currentState} does not match expected ${previousState}`,
        {
          aggregateId: this.id,
          expectedState: previousState,
          actualState: this.currentState,
        },
      );
    }

    if (!getFeedLifecycleStateMachine().canTransition(this.currentState, nextState)) {
      throw new FeedLifecycleViolationError(
        `Invalid lifecycle transition from ${this.currentState} to ${nextState}`,
        {
          aggregateId: this.id,
          fromState: this.currentState,
          toState: nextState,
        },
      );
    }

    this.status = nextState;
    this.state = nextState;
    this.currentState = nextState;
    this.lifecycleState = nextState;
    this.version += 1;
    this.updatedAt = input.timestamp ?? Date.now();

    this.metadata = {
      ...this.metadata,
      ...(input.metadata ?? {}),
      lastTransitionReason: input.reason,
      lastTransitionActor: input.actor,
      lastTransitionCorrelationId: input.correlationId ?? null,
      lastTransitionTimestamp: input.timestamp,
    };

    this.lifecycleMetadata = {
      ...this.lifecycleMetadata,
      lastTransition: {
        previousState,
        nextState,
        actor: input.actor,
        reason: input.reason,
        timestamp: input.timestamp,
        correlationId: input.correlationId,
      },
    };

    this.events.push({
      type: 'FeedLifecycleTransitionApplied',
      aggregateId: this.id,
      version: this.version,
      occurredAt: this.updatedAt,
      state: nextState,
      metadata: {
        previousState,
        nextState,
        actor: input.actor,
        reason: input.reason,
      },
    });

    this._snapshot = this.createSnapshot();
  }

  public activate(
    actor = 'system',
    reason = 'activate-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('ACTIVE', actor, reason, metadata);
  }

  public pause(
    actor = 'system',
    reason = 'pause-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('PAUSED', actor, reason, metadata);
  }

  public archive(
    actor = 'system',
    reason = 'archive-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('ARCHIVED', actor, reason, metadata);
  }

  public disable(
    actor = 'system',
    reason = 'disable-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('DISABLED', actor, reason, metadata);
  }

  public enable(
    actor = 'system',
    reason = 'enable-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('ACTIVE', actor, reason, metadata);
  }

  public markFailed(
    actor = 'system',
    reason = 'mark-failed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('SYNC_FAILED', actor, reason, metadata);
  }

  public scheduleSync(
    actor = 'system',
    reason = 'schedule-sync',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('SYNCING', actor, reason, metadata);
  }

  public recover(
    actor = 'system',
    reason = 'recover-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('ACTIVE', actor, reason, metadata);
  }

  public restore(
    actor = 'system',
    reason = 'restore-feed',
    metadata: Record<string, unknown> = {},
  ): void {
    this.transitionTo('ACTIVE', actor, reason, metadata);
  }

  private transitionTo(
    nextState: FeedLifecycleState | string,
    actor: string,
    reason: string,
    metadata: Record<string, unknown>,
  ): void {
    this.applyLifecycleTransition({
      previousState: this.currentState,
      nextState: normalizeFeedStatus(nextState) as FeedLifecycleState,
      reason,
      actor,
      timestamp: Date.now(),
      correlationId: undefined,
      metadata,
    });
  }

  private createSnapshot(): FeedLifecycleAggregateSnapshot {
    return {
      id: this.id,
      identity: this.identity,
      status: this.status,
      currentState: this.currentState,
      lifecycleState: this.lifecycleState,
      version: this.version,
      metadata: { ...this.metadata },
      lifecycleMetadata: { ...this.lifecycleMetadata },
      operationalMetadata: { ...this.operationalMetadata },
      synchronizationMetadata: { ...this.synchronizationMetadata },
      configurationSnapshot: { ...this.configurationSnapshot },
      subscriptionMetadata: { ...this.subscriptionMetadata },
      regionalMetadata: { ...this.regionalMetadata },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
