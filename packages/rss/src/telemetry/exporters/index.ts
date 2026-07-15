export interface TelemetryExporterContract {
  readonly name: string;
  export(
    metrics: readonly unknown[],
    events: readonly unknown[],
    traces: readonly unknown[],
    warnings: readonly unknown[],
  ): void | Promise<void>;
}
