import type { FeedHealthEvaluationRequest } from '../interfaces/feed-health-evaluation-request';
import type { FeedHealthLifecycleHooks } from '../interfaces/feed-health-lifecycle-hooks';
import type { FeedHealthScoringEngine } from '../interfaces/feed-health-scoring-engine';
import type { FeedHealthClassificationEngine } from '../interfaces/feed-health-classification-engine';
import {
  createFeedHealth,
  type FeedHealth,
  type FeedHealthMetricSet,
  type FeedHealthWarning,
} from '../types/feed-health';
import { HealthEvaluationError } from '../errors';
import type { FeedHealthTrendMetadata } from '../types/feed-health';

export interface FeedHealthEvaluatorDependencies {
  readonly scoringEngine?: FeedHealthScoringEngine;
  readonly classificationEngine?: FeedHealthClassificationEngine;
  readonly hooks?: FeedHealthLifecycleHooks;
}

export class FeedHealthEvaluator {
  private readonly scoringEngine: FeedHealthScoringEngine;
  private readonly classificationEngine: FeedHealthClassificationEngine;
  private readonly hooks: FeedHealthLifecycleHooks | undefined;

  public constructor(dependencies: FeedHealthEvaluatorDependencies = {}) {
    this.scoringEngine = dependencies.scoringEngine ?? {
      id: 'default-feed-health-scoring',
      score: () => 100,
    };
    this.classificationEngine = dependencies.classificationEngine ?? {
      id: 'default-feed-health-classification',
      classify: () => ({
        id: 'unknown-feed',
        label: 'Unknown Feed',
        reason: 'No classification engine was provided.',
        severity: 'warning',
      }),
    };
    this.hooks = dependencies.hooks;
  }

  public async evaluate(request: FeedHealthEvaluationRequest): Promise<FeedHealth> {
    const startedAt = Date.now();
    await this.hooks?.onEvaluationStarted?.({
      type: 'evaluation-started',
      feedId: request.feedId,
      timestamp: startedAt,
      payload: { evaluatedAt: request.evaluatedAt?.toISOString() },
    });
    try {
      if (!request.feedId) {
        throw new HealthEvaluationError(
          'Feed identifier is required.',
          request.feedId,
          { request },
          'Provide a non-empty feed identifier.',
        );
      }
      if (!request.metrics) {
        throw new HealthEvaluationError(
          'Health metrics are required.',
          request.feedId,
          { request },
          'Provide a metric set before evaluation.',
        );
      }
      const metrics = this.normalizeMetrics(request.metrics);
      await this.hooks?.onMetricsCollected?.({
        type: 'metrics-collected',
        feedId: request.feedId,
        timestamp: Date.now(),
        payload: { metrics },
      });
      const score = this.scoringEngine.score(metrics);
      await this.hooks?.onScoreCalculated?.({
        type: 'score-calculated',
        feedId: request.feedId,
        timestamp: Date.now(),
        payload: { score },
      });
      const status = this.resolveStatus(score, metrics);
      const classification = this.classificationEngine.classify(
        score,
        status,
        metrics as unknown as Record<string, number>,
      );
      await this.hooks?.onClassificationCompleted?.({
        type: 'classification-completed',
        feedId: request.feedId,
        timestamp: Date.now(),
        payload: { classification },
      });
      const warnings = this.createWarnings(metrics, score, status);
      const evaluationDurationMs = request.evaluationDurationMs ?? 1;
      const trend: FeedHealthTrendMetadata = {
        direction:
          request.previousScore !== undefined && request.previousScore > score
            ? 'Declining'
            : 'Stable',
        confidence: 0.7,
        previousScore: request.previousScore,
        currentScore: score,
      };
      const health = createFeedHealth({
        feedId: request.feedId,
        score,
        status,
        evaluatedAt: request.evaluatedAt ?? new Date(),
        version: 1,
        metadata: { ...(request.metadata ?? {}) },
        warnings,
        statistics: metrics,
        trend,
        evaluationDurationMs,
      });
      await this.hooks?.onReportGenerated?.({
        type: 'report-generated',
        feedId: request.feedId,
        timestamp: Date.now(),
        payload: { reportId: `health:${request.feedId}:${health.version}` },
      });
      return health;
    } catch (error) {
      await this.hooks?.onEvaluationFailed?.({
        type: 'evaluation-failed',
        feedId: request.feedId,
        timestamp: Date.now(),
        payload: { error },
      });
      throw error;
    }
  }

  private normalizeMetrics(metrics: FeedHealthMetricSet): FeedHealthMetricSet {
    return {
      successRate: Math.max(0, Math.min(1, metrics.successRate ?? 0)),
      failureRate: Math.max(0, Math.min(1, metrics.failureRate ?? 0)),
      averageSyncDurationMs: Math.max(0, metrics.averageSyncDurationMs ?? 0),
      averageDownloadTimeMs: Math.max(0, metrics.averageDownloadTimeMs ?? 0),
      averageImportTimeMs: Math.max(0, metrics.averageImportTimeMs ?? 0),
      checkpointAgeMs: Math.max(0, metrics.checkpointAgeMs ?? 0),
      feedFreshnessMs: Math.max(0, metrics.feedFreshnessMs ?? 0),
      episodeGrowth: Math.max(0, metrics.episodeGrowth ?? 0),
      synchronizationFrequency: Math.max(0, metrics.synchronizationFrequency ?? 0),
      metadataChanges: Math.max(0, metrics.metadataChanges ?? 0),
      providerAvailability: Math.max(0, Math.min(1, metrics.providerAvailability ?? 0)),
    };
  }

  private resolveStatus(
    score: number,
    metrics: FeedHealthMetricSet,
  ):
    'Excellent' | 'Healthy' | 'Good' | 'Warning' | 'Degraded' | 'Critical' | 'Offline' | 'Unknown' {
    if (score >= 95 && metrics.providerAvailability >= 0.95 && metrics.failureRate <= 0.01) {
      return 'Excellent';
    }
    if (score >= 85 && metrics.providerAvailability >= 0.9 && metrics.failureRate <= 0.05) {
      return 'Healthy';
    }
    if (score >= 70 && metrics.providerAvailability >= 0.75) {
      return 'Good';
    }
    if (score >= 55) {
      return 'Warning';
    }
    if (score >= 35) {
      return 'Degraded';
    }
    if (metrics.providerAvailability < 0.5 || metrics.failureRate > 0.25) {
      return 'Critical';
    }
    return 'Unknown';
  }

  private createWarnings(
    metrics: FeedHealthMetricSet,
    score: number,
    status: string,
  ): readonly FeedHealthWarning[] {
    const warnings: FeedHealthWarning[] = [];
    if (metrics.failureRate > 0.2) {
      warnings.push({
        code: 'high-failure-rate',
        message: 'High failure rate observed.',
        severity: 'warning',
      });
    }
    if (metrics.averageSyncDurationMs > 5000) {
      warnings.push({
        code: 'slow-synchronization',
        message: 'Synchronization is slower than expected.',
        severity: 'warning',
      });
    }
    if (metrics.checkpointAgeMs > 600000) {
      warnings.push({
        code: 'outdated-checkpoint',
        message: 'Checkpoint is stale.',
        severity: 'warning',
      });
    }
    if (metrics.feedFreshnessMs > 900000) {
      warnings.push({
        code: 'inactive-feed',
        message: 'Feed has not refreshed recently.',
        severity: 'warning',
      });
    }
    if (metrics.metadataChanges > 10) {
      warnings.push({
        code: 'rapid-metadata-changes',
        message: 'Metadata changed rapidly.',
        severity: 'warning',
      });
    }
    if (metrics.providerAvailability < 0.8) {
      warnings.push({
        code: 'provider-instability',
        message: 'Provider availability is below expected reliability.',
        severity: 'critical',
      });
    }
    if (score < 50) {
      warnings.push({
        code: 'large-sync-gap',
        message: 'The feed appears to be outside the healthy window.',
        severity: 'warning',
      });
    }
    return Object.freeze([...warnings]) as readonly FeedHealthWarning[];
  }
}
