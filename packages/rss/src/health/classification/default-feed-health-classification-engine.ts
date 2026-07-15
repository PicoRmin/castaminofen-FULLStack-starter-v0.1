import type {
  FeedHealthClassificationEngine,
  FeedHealthClassificationResult,
} from '../interfaces/feed-health-classification-engine';

export class DefaultFeedHealthClassificationEngine implements FeedHealthClassificationEngine {
  public readonly id = 'default-feed-health-classification';

  public classify(
    score: number,
    status: string,
    metrics: Record<string, number | undefined>,
  ): FeedHealthClassificationResult {
    const normalizedStatus = status.toLowerCase();
    if (score >= 90 && normalizedStatus === 'healthy') {
      return {
        id: 'healthy-feed',
        label: 'Healthy Feed',
        reason: 'Health metrics are within expected ranges.',
        severity: 'info',
      };
    }
    if (score >= 70) {
      return {
        id: 'warning-feed',
        label: 'Slow Feed',
        reason: 'The feed is operating but some metrics are below the target threshold.',
        severity: 'warning',
      };
    }
    const failureRate = metrics.failureRate ?? 0;
    const providerAvailability = metrics.providerAvailability ?? 0;
    const checkpointAgeMs = metrics.checkpointAgeMs ?? 0;
    const feedFreshnessMs = metrics.feedFreshnessMs ?? 0;
    if (failureRate > 0.2 || providerAvailability < 0.6) {
      return {
        id: 'provider-issue',
        label: 'Provider Issue',
        reason: 'High failure or poor provider availability was observed.',
        severity: 'critical',
      };
    }
    if (checkpointAgeMs > 600000 || feedFreshnessMs > 900000) {
      return {
        id: 'outdated-feed',
        label: 'Outdated Feed',
        reason: 'The feed has become stale relative to the expected freshness window.',
        severity: 'warning',
      };
    }
    return {
      id: 'unknown-feed',
      label: 'Unknown Feed',
      reason: 'Insufficient evidence to classify the feed health reliably.',
      severity: 'warning',
    };
  }
}
