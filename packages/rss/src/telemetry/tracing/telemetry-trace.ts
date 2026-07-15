import type { TelemetryMetadata } from '../types/metric-types';
import type { TelemetrySpan } from '../interfaces';

export interface TelemetryTrace {
  readonly id: string;
  readonly traceId: string;
  readonly operationId: string;
  readonly parentSpanId?: string | undefined;
  readonly name: string;
  readonly startTime: number;
  readonly endTime?: number | undefined;
  readonly durationMs?: number | undefined;
  readonly status: 'ok' | 'error' | 'pending';
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
  readonly metadata: Readonly<TelemetryMetadata> | undefined;
}

export class TelemetryTraceSpan implements TelemetrySpan {
  private _endTime: number | undefined;
  private _status: 'ok' | 'error' | 'pending' = 'pending';
  private readonly attributes: Map<string, string | number | boolean> = new Map();

  constructor(
    public readonly id: string,
    public readonly traceId: string,
    public readonly operationId: string,
    public readonly name: string,
    public readonly startTime: number,
    public readonly parentSpanId: string | undefined,
    private readonly onEnd: (span: TelemetryTrace) => void,
    private readonly metadata: Readonly<TelemetryMetadata> | undefined,
  ) {}

  public get endTime(): number | undefined {
    return this._endTime;
  }

  public get status(): 'ok' | 'error' | 'pending' {
    return this._status;
  }

  public end(): TelemetrySpan {
    if (this._endTime === undefined) {
      this._endTime = Date.now();
      this._status = 'ok';
      this.onEnd(this.toSnapshot());
    }
    return this as TelemetrySpan;
  }

  public recordMetric(name: string, value: number, metadata?: TelemetryMetadata): void {
    this.attributes.set(`metric:${name}`, value);
    this.attributes.set(`metric:${name}:metadata`, metadata?.correlationId ?? '');
  }

  public addAttribute(key: string, value: string | number | boolean): void {
    this.attributes.set(key, value);
  }

  public toSnapshot(): TelemetryTrace {
    return Object.freeze({
      id: this.id,
      traceId: this.traceId,
      operationId: this.operationId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      endTime: this._endTime,
      durationMs: this._endTime === undefined ? undefined : this._endTime - this.startTime,
      status: this._status,
      attributes: Object.freeze(Object.fromEntries(this.attributes.entries())),
      metadata: this.metadata ? Object.freeze({ ...this.metadata }) : undefined,
    });
  }
}
