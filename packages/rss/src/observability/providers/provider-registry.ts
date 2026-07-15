import type { MonitoringProvider } from '../contracts/observability-contracts';

export class DefaultProviderRegistry {
  private readonly providers = new Map<string, MonitoringProvider>();

  public register(provider: MonitoringProvider): void {
    this.providers.set(provider.kind, provider);
  }

  public get(kind: string): MonitoringProvider | undefined {
    return this.providers.get(kind);
  }

  public list(): readonly MonitoringProvider[] {
    return Array.from(this.providers.values());
  }
}
