import type { TelemetryMetadata } from '../types/metric-types';

export interface TelemetryEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<TelemetryMetadata> | undefined;
}

export interface TelemetryWarning {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly timestamp: number;
  readonly metadata: Readonly<TelemetryMetadata> | undefined;
}

export function createTelemetryEvent(
  type: string,
  payload: Record<string, unknown> = {},
  metadata?: TelemetryMetadata,
): TelemetryEvent {
  return Object.freeze({
    type,
    timestamp: Date.now(),
    payload: Object.freeze({ ...payload }),
    metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
  });
}

export function createTelemetryWarning(
  code: string,
  message: string,
  stage: string,
  metadata?: TelemetryMetadata,
): TelemetryWarning {
  return Object.freeze({
    code,
    message,
    stage,
    timestamp: Date.now(),
    metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
  });
}
