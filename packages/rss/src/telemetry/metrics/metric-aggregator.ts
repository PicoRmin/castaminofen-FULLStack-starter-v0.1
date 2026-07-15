import type { TelemetryMetricAggregator } from '../interfaces';
import type { TelemetryMetricSample, TelemetryMetricSnapshot, TelemetryMetricKind } from '../types/metric-types';

export class DefaultTelemetryMetricAggregator implements TelemetryMetricAggregator {
  public aggregate(samples: readonly TelemetryMetricSample[]): TelemetryMetricSnapshot {
    if (samples.length === 0) {
      return Object.freeze({
        name: 'empty',
        kind: 'counter',
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        latest: 0,
        rate: 0,
        percentiles: Object.freeze({ p50: 0, p95: 0, p99: 0 }),
        metadata: undefined,
      });
    }

    const values = samples.map((sample) => sample.value).sort((left, right) => left - right);
    const sum = values.reduce((total, value) => total + value, 0);
    const count = values.length;
    const average = sum / count;
    const min = values[0] ?? 0;
    const max = values[count - 1] ?? 0;
    const latest = values[count - 1] ?? 0;
    const windowSeconds = Math.max(1, Math.ceil((values[count - 1] - values[0]) / 1000));
    const rate = count / windowSeconds;
    const metadata = samples.at(-1)?.metadata;

    return Object.freeze({
      name: samples[0]?.name ?? 'unknown',
      kind: (samples[0]?.kind ?? 'counter') as TelemetryMetricKind,
      count,
      sum,
      average,
      min,
      max,
      latest,
      rate,
      percentiles: Object.freeze({
        p50: this.percentile(values, 0.5),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99),
      }),
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });
  }

  public merge(snapshots: readonly TelemetryMetricSnapshot[]): TelemetryMetricSnapshot | undefined {
    if (snapshots.length === 0) {
      return undefined;
    }

    const aggregate = snapshots[0];
    return Object.freeze({
      name: aggregate.name,
      kind: aggregate.kind,
      count: snapshots.reduce((total, snapshot) => total + snapshot.count, 0),
      sum: snapshots.reduce((total, snapshot) => total + snapshot.sum, 0),
      average: snapshots.reduce((total, snapshot) => total + snapshot.average, 0) / snapshots.length,
      min: Math.min(...snapshots.map((snapshot) => snapshot.min)),
      max: Math.max(...snapshots.map((snapshot) => snapshot.max)),
      latest: snapshots[snapshots.length - 1]?.latest ?? 0,
      rate: snapshots.reduce((total, snapshot) => total + snapshot.rate, 0),
      percentiles: Object.freeze({
        p50: this.percentile(snapshots.map((snapshot) => snapshot.average), 0.5),
        p95: this.percentile(snapshots.map((snapshot) => snapshot.average), 0.95),
        p99: this.percentile(snapshots.map((snapshot) => snapshot.average), 0.99),
      }),
      metadata: snapshots.at(-1)?.metadata,
    });
  }

  private percentile(values: readonly number[], ratio: number): number {
    if (values.length === 0) {
      return 0;
    }

    const index = Math.min(values.length - 1, Math.max(0, Math.floor(ratio * values.length)));
    return values[index] ?? 0;
  }
}
