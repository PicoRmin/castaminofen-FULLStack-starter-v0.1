export interface SchedulerLifecycleEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createSchedulerLifecycleEvent(
  type: string,
  payload: Record<string, unknown> = {},
  metadata?: Record<string, unknown>,
): SchedulerLifecycleEvent {
  return Object.freeze({
    type,
    timestamp: Date.now(),
    payload: Object.freeze({ ...payload }),
    metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
  }) as SchedulerLifecycleEvent;
}
