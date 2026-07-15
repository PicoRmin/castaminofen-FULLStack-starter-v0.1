import type {
  FeedHealth,
  FeedHealthStatistics,
  FeedHealthTrendMetadata,
  FeedHealthWarning,
} from '../types/feed-health';
import { HealthReportError } from '../errors';

export interface FeedHealthReport {
  readonly feedId: string;
  readonly overallHealth: string;
  readonly score: number;
  readonly classification: {
    readonly id: string;
    readonly label: string;
    readonly reason: string;
    readonly severity: 'info' | 'warning' | 'critical';
  };
  readonly detectedIssues: readonly string[];
  readonly warnings: readonly FeedHealthWarning[];
  readonly recommendations: readonly string[];
  readonly evaluationMetadata: {
    readonly evaluatedAt: Date;
    readonly version: number;
    readonly evaluationDurationMs: number;
  };
  readonly trend: FeedHealthTrendMetadata;
  readonly statistics: FeedHealthStatistics;
}

export function createFeedHealthReport(health: FeedHealth): FeedHealthReport {
  if (!health.feedId) {
    throw new HealthReportError(
      'Feed identifier is required.',
      health.feedId,
      { health },
      'Provide a valid feed identifier.',
    );
  }
  const detectedIssues = [] as string[];
  if (health.score < 60) {
    detectedIssues.push('Overall score is below the target band.');
  }
  if (health.warnings.some((warning) => warning.code === 'provider-instability')) {
    detectedIssues.push('Provider instability was detected.');
  }
  const recommendations = [] as string[];
  recommendations.push('Review feed availability and provider health.');
  if (health.score < 70) {
    recommendations.push('Inspect recent synchronization and metadata consistency.');
  }
  return Object.freeze({
    feedId: health.feedId,
    overallHealth: health.status,
    score: health.score,
    classification: Object.freeze({
      id: 'healthy-feed',
      label: 'Healthy Feed',
      reason: 'Health metrics are within expected ranges.',
      severity: 'info',
    }),
    detectedIssues: Object.freeze(detectedIssues),
    warnings: Object.freeze([...health.warnings]),
    recommendations: Object.freeze(recommendations),
    evaluationMetadata: Object.freeze({
      evaluatedAt: health.evaluatedAt,
      version: health.version,
      evaluationDurationMs: health.evaluationDurationMs,
    }),
    trend: Object.freeze({ ...health.trend }),
    statistics: Object.freeze({ ...health.statistics }),
  }) as FeedHealthReport;
}
