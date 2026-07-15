export type ObservabilityEventKind =
  | 'ObservationStarted'
  | 'ObservationCompleted'
  | 'ObservationFailed'
  | 'CollectorStarted'
  | 'CollectorCompleted'
  | 'DiagnosticsCompleted'
  | 'SnapshotCreated';

export interface ObservabilityEvent {
  readonly kind: ObservabilityEventKind;
  readonly observationId: string;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly component: string;
  readonly resource: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createObservabilityEvent(
  kind: ObservabilityEventKind,
  context: {
    readonly observationId: string;
    readonly correlationId: string;
    readonly component: string;
    readonly resource: string;
    readonly timestamp?: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
  },
): ObservabilityEvent {
  return Object.freeze({
    kind,
    observationId: context.observationId,
    correlationId: context.correlationId,
    timestamp: context.timestamp ?? Date.now(),
    component: context.component,
    resource: context.resource,
    metadata: context.metadata ? Object.freeze({ ...context.metadata }) : undefined,
  });
}
