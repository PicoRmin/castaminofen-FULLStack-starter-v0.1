import { ConfigurationFailure } from '../errors/observability-errors';
import type { ObservabilityConfiguration } from '../types/observability-types';

export class ObservabilityConfigurationManager {
  public constructor(private readonly configuration: ObservabilityConfiguration = {}) {}

  public getConfiguration(): ObservabilityConfiguration {
    return Object.freeze({
      sampling: this.configuration.sampling ?? 1,
      refreshIntervalMs: this.configuration.refreshIntervalMs ?? 5_000,
      retentionMs: this.configuration.retentionMs ?? 3_600_000,
      aggregationWindowMs: this.configuration.aggregationWindowMs ?? 60_000,
      historicalDepth: this.configuration.historicalDepth ?? 10,
      filtering: Object.freeze({ ...(this.configuration.filtering ?? {}) }),
      grouping: Object.freeze([...(this.configuration.grouping ?? [])]),
      featureFlags: Object.freeze({ ...(this.configuration.featureFlags ?? {}) }),
    });
  }

  public validate(): void {
    const config = this.getConfiguration();
    const sampling = config.sampling ?? 1;
    const refreshIntervalMs = config.refreshIntervalMs ?? 5_000;
    if (sampling < 0 || sampling > 1) {
      throw new ConfigurationFailure('Sampling must be between 0 and 1.', {
        observationId: 'configuration',
        component: 'configuration',
        correlationId: 'configuration',
        collectionStage: 'configuration',
        recoveryRecommendation: 'Use a sampling value between 0 and 1.',
      });
    }
    if (refreshIntervalMs <= 0) {
      throw new ConfigurationFailure('Refresh interval must be positive.', {
        observationId: 'configuration',
        component: 'configuration',
        correlationId: 'configuration',
        collectionStage: 'configuration',
        recoveryRecommendation: 'Use a positive refresh interval.',
      });
    }
  }
}
