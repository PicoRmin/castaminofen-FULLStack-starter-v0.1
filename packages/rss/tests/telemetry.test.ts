import test from 'node:test';
import assert from 'node:assert/strict';
import { SynchronizationTelemetry, type TelemetryExporter, type TelemetryEvent } from '../src/telemetry';

test('collects metrics, emits events, and exports snapshots', async () => {
  let exportedEvents: readonly TelemetryEvent[] = [];

  const exporter: TelemetryExporter = {
    name: 'test-exporter',
    export: async (metrics, events, traces, warnings) => {
      exportedEvents = events;
      assert.equal(metrics.length, 1);
      assert.equal(traces.length, 1);
      assert.equal(warnings.length, 0);
    },
  };

  const telemetry = new SynchronizationTelemetry({ exporters: [exporter] });

  telemetry.recordMetric('sync.duration.ms', 150, { correlationId: 'corr-1', operationId: 'op-1' });
  telemetry.recordMetric('sync.duration.ms', 250, { correlationId: 'corr-1', operationId: 'op-1' });
  telemetry.emitEvent('synchronization-started', { feedId: 'feed-1' }, { correlationId: 'corr-1' });

  const span = telemetry.startTrace('sync', { correlationId: 'corr-1' });
  span.end();

  const snapshot = telemetry.snapshot();
  assert.equal(snapshot.metrics.length, 1);
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.traces.length, 1);

  const aggregated = snapshot.metrics[0];
  assert.equal(aggregated.count, 2);
  assert.equal(aggregated.sum, 400);
  assert.equal(aggregated.average, 200);

  await telemetry.flush();
  assert.equal(exportedEvents.length, 1);
});
