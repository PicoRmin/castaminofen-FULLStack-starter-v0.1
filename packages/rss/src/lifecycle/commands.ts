import { randomUUID } from 'node:crypto';

import type { FeedLifecycleState, FeedLifecycleTransitionRequest } from './types';

export type TransitionCommandCategory =
  | 'lifecycle'
  | 'operational'
  | 'administrative'
  | 'recovery'
  | 'failure'
  | 'system'
  | 'user-initiated'
  | 'automated'
  | 'scheduled'
  | 'background';

export type TransitionCommandType =
  'normal' | 'failure' | 'recovery' | 'maintenance' | 'administrative' | 'migration' | 'terminal';

export interface TransitionCommandIdentity {
  readonly id: string;
  readonly correlationId: string | undefined;
  readonly causationId: string | undefined;
  readonly idempotencyKey: string | undefined;
  readonly requestId: string | undefined;
  readonly executionId: string | undefined;
  readonly pipelineId: string | undefined;
  readonly traceId: string | undefined;
}

export interface TransitionCommandFeed {
  readonly id: string;
  readonly uuid?: string;
  readonly slug?: string;
  readonly providerIdentifier?: string;
  readonly repositoryIdentifier?: string;
  readonly tenantIdentifier?: string;
  readonly workspaceIdentifier?: string;
}

export interface TransitionCommandTransition {
  readonly currentState: FeedLifecycleState | string;
  readonly targetState: FeedLifecycleState | string;
  readonly identifier?: string;
  readonly category?: TransitionCommandCategory;
  readonly type?: TransitionCommandType;
  readonly transitionMetadata?: Readonly<Record<string, unknown>>;
  readonly requestedOperation?: string;
  readonly requestedAction?: string;
}

export interface TransitionCommandActor {
  readonly id: string;
  readonly type?: string;
  readonly role?: string;
  readonly requestSource?: string;
  readonly executionSource?: string;
  readonly triggerSource?: string;
  readonly administrativeContext?: Readonly<Record<string, unknown>>;
  readonly systemContext?: Readonly<Record<string, unknown>>;
  readonly apiClientContext?: Readonly<Record<string, unknown>>;
  readonly workerContext?: Readonly<Record<string, unknown>>;
}

export interface TransitionCommandExecutionContext {
  readonly executionTimestamp?: number;
  readonly environment?: string;
  readonly featureFlags?: Readonly<Record<string, unknown>>;
  readonly configurationSnapshot?: Readonly<Record<string, unknown>>;
  readonly repositorySnapshot?: Readonly<Record<string, unknown>>;
  readonly requestMetadata?: Readonly<Record<string, unknown>>;
  readonly pipelineMetadata?: Readonly<Record<string, unknown>>;
  readonly validationMetadata?: Readonly<Record<string, unknown>>;
  readonly guardMetadata?: Readonly<Record<string, unknown>>;
  readonly policyMetadata?: Readonly<Record<string, unknown>>;
  readonly decisionMetadata?: Readonly<Record<string, unknown>>;
  readonly retryMetadata?: Readonly<Record<string, unknown>>;
  readonly recoveryMetadata?: Readonly<Record<string, unknown>>;
  readonly notificationMetadata?: Readonly<Record<string, unknown>>;
  readonly auditMetadata?: Readonly<Record<string, unknown>>;
  readonly metricsMetadata?: Readonly<Record<string, unknown>>;
  readonly loggingMetadata?: Readonly<Record<string, unknown>>;
}

export interface TransitionCommandMetadata {
  readonly custom?: Readonly<Record<string, unknown>>;
  readonly validation?: Readonly<Record<string, unknown>>;
  readonly guard?: Readonly<Record<string, unknown>>;
  readonly policy?: Readonly<Record<string, unknown>>;
  readonly decision?: Readonly<Record<string, unknown>>;
  readonly retry?: Readonly<Record<string, unknown>>;
  readonly recovery?: Readonly<Record<string, unknown>>;
  readonly notification?: Readonly<Record<string, unknown>>;
  readonly audit?: Readonly<Record<string, unknown>>;
  readonly metrics?: Readonly<Record<string, unknown>>;
  readonly logging?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface TransitionCommandInput {
  readonly id: string | undefined;
  readonly correlationId: string | undefined;
  readonly causationId: string | undefined;
  readonly idempotencyKey: string | undefined;
  readonly requestId: string | undefined;
  readonly executionId: string | undefined;
  readonly pipelineId: string | undefined;
  readonly traceId: string | undefined;
  readonly feed: TransitionCommandFeed;
  readonly transition: TransitionCommandTransition;
  readonly actor: TransitionCommandActor | undefined;
  readonly executionContext: TransitionCommandExecutionContext | undefined;
  readonly metadata: TransitionCommandMetadata | undefined;
  readonly version: string | undefined;
  readonly timestamp: number | undefined;
}

export interface TransitionCommandSerializable extends TransitionCommandInput {
  readonly version: string;
  readonly timestamp: number;
}

export class TransitionCommand implements TransitionCommandInput {
  public readonly id: string;
  public readonly correlationId: string | undefined;
  public readonly causationId: string | undefined;
  public readonly idempotencyKey: string | undefined;
  public readonly requestId: string | undefined;
  public readonly executionId: string | undefined;
  public readonly pipelineId: string | undefined;
  public readonly traceId: string | undefined;
  public readonly feed: TransitionCommandFeed;
  public readonly transition: TransitionCommandTransition;
  public readonly actor: TransitionCommandActor;
  public readonly executionContext: TransitionCommandExecutionContext;
  public readonly metadata: TransitionCommandMetadata;
  public readonly version: string;
  public readonly timestamp: number;

  constructor(input: TransitionCommandInput) {
    const normalized = normalizeTransitionCommandInput(input);
    this.id = normalized.id ?? `cmd-${randomUUID()}`;
    this.correlationId = normalized.correlationId;
    this.causationId = normalized.causationId;
    this.idempotencyKey = normalized.idempotencyKey;
    this.requestId = normalized.requestId;
    this.executionId = normalized.executionId;
    this.pipelineId = normalized.pipelineId;
    this.traceId = normalized.traceId;
    this.feed = normalized.feed ?? { id: 'unknown' };
    this.transition = normalized.transition ?? {
      currentState: 'UNKNOWN',
      targetState: 'UNKNOWN',
    };
    this.actor = normalized.actor ?? { id: 'system' };
    this.executionContext = normalized.executionContext ?? { executionTimestamp: Date.now() };
    this.metadata = normalized.metadata ?? {};
    this.version = normalized.version ?? '1.0';
    this.timestamp = normalized.timestamp ?? Date.now();

    Object.freeze(this);
    Object.freeze(this.feed);
    Object.freeze(this.transition);
    Object.freeze(this.actor);
    Object.freeze(this.executionContext);
    Object.freeze(this.metadata);
  }

  public toJSON(): TransitionCommandSerializable {
    const json: Record<string, unknown> = {
      id: this.id,
      feed: { ...this.feed },
      transition: { ...this.transition },
      actor: { ...this.actor },
      executionContext: { ...this.executionContext },
      metadata: { ...this.metadata },
      version: this.version,
      timestamp: this.timestamp,
    };

    if (this.correlationId !== undefined) {
      json.correlationId = this.correlationId;
    }
    if (this.causationId !== undefined) {
      json.causationId = this.causationId;
    }
    if (this.idempotencyKey !== undefined) {
      json.idempotencyKey = this.idempotencyKey;
    }
    if (this.requestId !== undefined) {
      json.requestId = this.requestId;
    }
    if (this.executionId !== undefined) {
      json.executionId = this.executionId;
    }
    if (this.pipelineId !== undefined) {
      json.pipelineId = this.pipelineId;
    }
    if (this.traceId !== undefined) {
      json.traceId = this.traceId;
    }

    return json as unknown as TransitionCommandSerializable;
  }

  public static fromJSON(input: TransitionCommandSerializable): TransitionCommand {
    return new TransitionCommand(input);
  }
}

export function createTransitionCommand(input: FeedLifecycleTransitionRequest): TransitionCommand;
export function createTransitionCommand(input: TransitionCommandInput): TransitionCommand;
export function createTransitionCommand(
  input: FeedLifecycleTransitionRequest | TransitionCommandInput,
): TransitionCommand {
  if (isTransitionCommandInstance(input)) {
    return input;
  }

  if (isLegacyTransitionRequest(input)) {
    const metadata = normalizeRecord(input.metadata);
    const requestMetadata = {
      reason: input.reason,
      source: 'legacy-transition-request',
      ...(metadata as Record<string, unknown>),
    };

    return new TransitionCommand({
      id: `cmd-${randomUUID()}`,
      correlationId: input.correlationId,
      causationId: undefined,
      idempotencyKey: undefined,
      requestId: input.correlationId,
      executionId: input.correlationId,
      pipelineId: undefined,
      traceId: input.correlationId,
      feed: {
        id: input.feedId,
      },
      transition: {
        currentState: input.currentState,
        targetState: input.targetState,
        identifier: `${String(input.currentState)}.${String(input.targetState)}`,
        category: 'lifecycle',
        type: 'normal',
        requestedOperation: 'transition',
        requestedAction: 'transition-feed',
      },
      actor: {
        id: input.actor ?? 'system',
        type: 'system',
        role: 'system',
        requestSource: 'feed-lifecycle-service',
        executionSource: 'service',
        triggerSource: 'legacy-request',
      },
      executionContext: {
        executionTimestamp: Date.now(),
        environment: 'unknown',
        requestMetadata,
        pipelineMetadata: {
          requestSource: 'feed-lifecycle-service',
        },
      },
      metadata: {
        custom: metadata ?? {},
        validation: {},
        guard: {},
        policy: {},
        decision: {},
        retry: {},
        recovery: {},
        notification: {},
        audit: {},
        metrics: {},
        logging: {},
      },
      version: undefined,
      timestamp: undefined,
    });
  }

  return new TransitionCommand(input);
}

function normalizeTransitionCommandInput(
  input: TransitionCommandInput,
): TransitionCommandSerializable {
  const timestamp = input.timestamp ?? Date.now();
  const executionContext = normalizeRecord(input.executionContext) as
    TransitionCommandExecutionContext | undefined;
  const metadata = normalizeRecord(input.metadata) as TransitionCommandMetadata | undefined;

  const normalizedExecutionContext: TransitionCommandExecutionContext = {
    executionTimestamp: timestamp,
  };

  if (executionContext?.environment !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).environment =
      executionContext.environment;
  }
  if (executionContext?.featureFlags !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).featureFlags = normalizeRecord(
      executionContext.featureFlags,
    );
  }
  if (executionContext?.configurationSnapshot !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).configurationSnapshot = normalizeRecord(
      executionContext.configurationSnapshot,
    );
  }
  if (executionContext?.repositorySnapshot !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).repositorySnapshot = normalizeRecord(
      executionContext.repositorySnapshot,
    );
  }
  if (executionContext?.requestMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).requestMetadata = normalizeRecord(
      executionContext.requestMetadata,
    );
  }
  if (executionContext?.pipelineMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).pipelineMetadata = normalizeRecord(
      executionContext.pipelineMetadata,
    );
  }
  if (executionContext?.validationMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).validationMetadata = normalizeRecord(
      executionContext.validationMetadata,
    );
  }
  if (executionContext?.guardMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).guardMetadata = normalizeRecord(
      executionContext.guardMetadata,
    );
  }
  if (executionContext?.policyMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).policyMetadata = normalizeRecord(
      executionContext.policyMetadata,
    );
  }
  if (executionContext?.decisionMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).decisionMetadata = normalizeRecord(
      executionContext.decisionMetadata,
    );
  }
  if (executionContext?.retryMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).retryMetadata = normalizeRecord(
      executionContext.retryMetadata,
    );
  }
  if (executionContext?.recoveryMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).recoveryMetadata = normalizeRecord(
      executionContext.recoveryMetadata,
    );
  }
  if (executionContext?.notificationMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).notificationMetadata = normalizeRecord(
      executionContext.notificationMetadata,
    );
  }
  if (executionContext?.auditMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).auditMetadata = normalizeRecord(
      executionContext.auditMetadata,
    );
  }
  if (executionContext?.metricsMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).metricsMetadata = normalizeRecord(
      executionContext.metricsMetadata,
    );
  }
  if (executionContext?.loggingMetadata !== undefined) {
    (normalizedExecutionContext as Record<string, unknown>).loggingMetadata = normalizeRecord(
      executionContext.loggingMetadata,
    );
  }

  const normalizedMetadata: TransitionCommandMetadata = {};
  if (metadata?.custom !== undefined) {
    (normalizedMetadata as Record<string, unknown>).custom = normalizeRecord(metadata.custom);
  }
  if (metadata?.validation !== undefined) {
    (normalizedMetadata as Record<string, unknown>).validation = normalizeRecord(
      metadata.validation,
    );
  }
  if (metadata?.guard !== undefined) {
    (normalizedMetadata as Record<string, unknown>).guard = normalizeRecord(metadata.guard);
  }
  if (metadata?.policy !== undefined) {
    (normalizedMetadata as Record<string, unknown>).policy = normalizeRecord(metadata.policy);
  }
  if (metadata?.decision !== undefined) {
    (normalizedMetadata as Record<string, unknown>).decision = normalizeRecord(metadata.decision);
  }
  if (metadata?.retry !== undefined) {
    (normalizedMetadata as Record<string, unknown>).retry = normalizeRecord(metadata.retry);
  }
  if (metadata?.recovery !== undefined) {
    (normalizedMetadata as Record<string, unknown>).recovery = normalizeRecord(metadata.recovery);
  }
  if (metadata?.notification !== undefined) {
    (normalizedMetadata as Record<string, unknown>).notification = normalizeRecord(
      metadata.notification,
    );
  }
  if (metadata?.audit !== undefined) {
    (normalizedMetadata as Record<string, unknown>).audit = normalizeRecord(metadata.audit);
  }
  if (metadata?.metrics !== undefined) {
    (normalizedMetadata as Record<string, unknown>).metrics = normalizeRecord(metadata.metrics);
  }
  if (metadata?.logging !== undefined) {
    (normalizedMetadata as Record<string, unknown>).logging = normalizeRecord(metadata.logging);
  }

  const normalizedMetadataEntries = normalizeRecord(metadata) as
    Record<string, unknown> | undefined;
  if (normalizedMetadataEntries !== undefined) {
    for (const [key, value] of Object.entries(normalizedMetadataEntries)) {
      if (
        key !== 'custom' &&
        key !== 'validation' &&
        key !== 'guard' &&
        key !== 'policy' &&
        key !== 'decision' &&
        key !== 'retry' &&
        key !== 'recovery' &&
        key !== 'notification' &&
        key !== 'audit' &&
        key !== 'metrics' &&
        key !== 'logging'
      ) {
        (normalizedMetadata as Record<string, unknown>)[key] = value;
      }
    }
  }

  return {
    id: input.id ?? `cmd-${randomUUID()}`,
    correlationId: input.correlationId,
    causationId: input.causationId,
    idempotencyKey: input.idempotencyKey,
    requestId: input.requestId,
    executionId: input.executionId,
    pipelineId: input.pipelineId,
    traceId: input.traceId,
    feed: normalizeRecord(input.feed) as TransitionCommandFeed,
    transition: normalizeRecord(input.transition) as TransitionCommandTransition,
    actor: normalizeRecord(input.actor ?? { id: 'system' }) as TransitionCommandActor,
    executionContext: normalizedExecutionContext,
    metadata: normalizedMetadata,
    version: input.version ?? '1.0',
    timestamp,
  } as unknown as TransitionCommandSerializable;
}

function normalizeRecord<T>(value: T | undefined): T | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeRecord(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const normalized: Record<string, unknown> = {};

    for (const [key, child] of entries) {
      normalized[key] = normalizeRecord(child);
    }

    return normalized as T;
  }

  return value;
}

function isLegacyTransitionRequest(
  input: FeedLifecycleTransitionRequest | TransitionCommandInput,
): input is FeedLifecycleTransitionRequest {
  return 'feedId' in input;
}

function isTransitionCommandInstance(
  input: FeedLifecycleTransitionRequest | TransitionCommandInput,
): input is TransitionCommand {
  return input instanceof TransitionCommand;
}
