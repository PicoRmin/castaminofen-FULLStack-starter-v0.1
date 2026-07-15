import type {
  MonitoringCollector,
  MonitoringCollectorRegistry,
} from '../contracts/observability-contracts';

export class DefaultCollectorRegistry implements MonitoringCollectorRegistry {
  private readonly collectors = new Map<string, MonitoringCollector>();

  public register(collector: MonitoringCollector): void {
    this.collectors.set(collector.kind, collector);
  }

  public get(kind: string): MonitoringCollector | undefined {
    return this.collectors.get(kind);
  }

  public list(): readonly MonitoringCollector[] {
    return Array.from(this.collectors.values());
  }
}
