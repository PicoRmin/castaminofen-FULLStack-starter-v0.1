import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedHealthEvaluator } from '../evaluation/feed-health-evaluator';
import { DefaultFeedHealthScoringEngine } from '../scoring/default-feed-health-scoring-engine';
import { DefaultFeedHealthClassificationEngine } from '../classification/default-feed-health-classification-engine';
import { createFeedHealthReport } from '../report/feed-health-report';
import { createFeedHealth } from '../types/feed-health';
import type { FeedHealthEvaluationRequest } from '../interfaces/feed-health-evaluation-request';

test('health evaluator produces deterministic health report for stable input', async () => {
  const request: FeedHealthEvaluationRequest = {
    feedId: 'feed-1',
    evaluatedAt: new Date('2026-07-15T00:00:00.000Z'),
    metrics: {
      successRate: 0.95,
      failureRate: 0.05,
      averageSyncDurationMs: 1250,
      averageDownloadTimeMs: 800,
      averageImportTimeMs: 250,
      checkpointAgeMs: 60000,
      feedFreshnessMs: 120000,
      episodeGrowth: 3,
      synchronizationFrequency: 2,
      metadataChanges: 0,
      providerAvailability: 0.98,
    },
    metadata: {
      provider: 'test-provider',
      sourceUrl: 'https://example.com/rss',
    },
  };

  const evaluator = new FeedHealthEvaluator({
    scoringEngine: new DefaultFeedHealthScoringEngine(),
    classificationEngine: new DefaultFeedHealthClassificationEngine(),
  });

  const health = await evaluator.evaluate(request);
  const report = createFeedHealthReport(health);
  assert.equal(health.feedId, 'feed-1');
  assert.equal(health.status, 'Healthy');
  assert.ok(health.score >= 0 && health.score <= 100);
  assert.equal(report.classification.id, 'healthy-feed');
  assert.equal(report.classification.reason, 'Health metrics are within expected ranges.');
  const second = await evaluator.evaluate(request);
  assert.deepEqual(second, health);
  assert.deepEqual(createFeedHealthReport(second), report);
});

test('createFeedHealth freezes the object and preserves provided metadata', () => {
  const health = createFeedHealth({
    feedId: 'feed-2',
    score: 54,
    status: 'Warning',
    evaluatedAt: new Date('2026-07-15T00:00:00.000Z'),
    version: 1,
    metadata: { provider: 'custom' },
    warnings: [
      {
        code: 'slow-synchronization',
        message: 'Slow synchronization detected.',
        severity: 'warning',
      },
    ],
    statistics: { successRate: 0.54 },
    trend: { direction: 'Declining', confidence: 0.4 },
    evaluationDurationMs: 12,
  });

  assert.equal(health.metadata.provider, 'custom');
  assert.equal(health.warnings[0]?.message, 'Slow synchronization detected.');
  assert.equal(Object.isFrozen(health), true);
  assert.equal(Object.isFrozen(health.metadata), true);
  assert.equal(Object.isFrozen(health.warnings), true);
});
