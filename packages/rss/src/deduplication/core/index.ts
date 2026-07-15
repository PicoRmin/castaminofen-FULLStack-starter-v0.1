import type { DeduplicationFeedCandidate, DeduplicationOptions, DeduplicationResult, DeduplicationStatistics, DeduplicationTiming, DeduplicationWarning, DuplicateCandidate } from '../types';
import { DuplicateDetectionError, ConflictDetectionError, ScoringError } from '../errors';
import { WeightedSimilarityScorer, DuplicateDetector } from '../scoring';
import { BasicConflictDetector, SimpleConflictClassifier } from '../conflicts';
import { InMemoryIdentityGraphBuilder } from '../graph';
import { PreferCanonicalUrlStrategy, PreferNewestMetadataStrategy, PreserveBothStrategy, ResolutionStrategyRegistry } from '../strategies';
import type { IDeduplicationService } from '../interfaces';

export class FeedDeduplicationService implements IDeduplicationService {
  private readonly scorer: WeightedSimilarityScorer;
  private readonly duplicateDetector: DuplicateDetector;
  private readonly conflictDetector: BasicConflictDetector;
  private readonly conflictClassifier: SimpleConflictClassifier;
  private readonly graphBuilder: InMemoryIdentityGraphBuilder;
  private readonly strategyRegistry: ResolutionStrategyRegistry;

  constructor(options?: DeduplicationOptions) {
    this.scorer = new WeightedSimilarityScorer(options?.weights);
    this.duplicateDetector = new DuplicateDetector();
    this.conflictDetector = new BasicConflictDetector();
    this.conflictClassifier = new SimpleConflictClassifier();
    this.graphBuilder = new InMemoryIdentityGraphBuilder();
    this.strategyRegistry = new ResolutionStrategyRegistry([
      new PreferCanonicalUrlStrategy(),
      new PreferNewestMetadataStrategy(),
      new PreserveBothStrategy(),
    ]);
  }

  public async deduplicate(feeds: readonly DeduplicationFeedCandidate[]): Promise<DeduplicationResult> {
    const startedAt = Date.now();
    try {
      const warnings: DeduplicationWarning[] = [];
      const duplicateCandidates: DuplicateCandidate[] = [];
      const conflicts: Array<DeduplicationResult['conflicts'][number]> = [];
      const resolutionRecommendations: Array<DeduplicationResult['resolutionRecommendations'][number]> = [];
      const confidenceScores: Array<DeduplicationResult['confidenceScores'][number]> = [];

      if (feeds.length === 0) {
        return this.createEmptyResult(warnings, startedAt);
      }

      const graph = await this.graphBuilder.build(feeds);
      const canonicalFeed = feeds[0];

      for (let index = 0; index < feeds.length; index += 1) {
        for (let inner = index + 1; inner < feeds.length; inner += 1) {
          const left = feeds[index];
          const right = feeds[inner];
          if (!left || !right) {
            continue;
          }
          const similarity = await this.scorer.score(left, right);
          const duplicate = await this.duplicateDetector.detect(left, right, similarity);
          const detectedConflicts = await this.conflictDetector.detect(left, right);
          const resolvedRecommendations = await this.strategyRegistry.resolve(left, right, detectedConflicts);
          const mappedConflicts = detectedConflicts.map((conflict) => ({
            ...conflict,
            classification: this.conflictClassifier.classify(conflict),
          }));

          duplicateCandidates.push({
            leftId: left.id,
            rightId: right.id,
            classification: duplicate.classification,
            confidence: duplicate.confidence,
            similarity: similarity.score,
            reasons: duplicate.reasons,
            conflicts: mappedConflicts,
          });

          conflicts.push(...mappedConflicts);
          resolutionRecommendations.push(...resolvedRecommendations);

          confidenceScores.push({
            feedId: left.id,
            score: duplicate.confidence,
            explanation: `Similarity ${similarity.score.toFixed(2)} with reasons ${duplicate.reasons.join(', ')}`,
            level: duplicate.confidence >= 0.85 ? 'high' : duplicate.confidence >= 0.6 ? 'medium' : 'low',
          });
          confidenceScores.push({
            feedId: right.id,
            score: duplicate.confidence,
            explanation: `Similarity ${similarity.score.toFixed(2)} with reasons ${duplicate.reasons.join(', ')}`,
            level: duplicate.confidence >= 0.85 ? 'high' : duplicate.confidence >= 0.6 ? 'medium' : 'low',
          });

          if (duplicate.confidence < 0.6) {
            warnings.push({ code: 'weak-confidence', message: `Weak confidence for ${left.id} and ${right.id}`, stage: 'duplicate', severity: 'warning' });
          }
          if (mappedConflicts.length > 0) {
            warnings.push({ code: 'conflicting-metadata', message: `Conflicts detected for ${left.id} and ${right.id}`, stage: 'conflict', severity: 'warning' });
          }
          if (!left.identity?.primaryKey || !right.identity?.primaryKey) {
            warnings.push({ code: 'missing-identifiers', message: 'A candidate is missing identity identifiers', stage: 'similarity', severity: 'info' });
          }
        }
      }

      const statistics: DeduplicationStatistics = {
        totalFeeds: feeds.length,
        duplicateCount: duplicateCandidates.filter((candidate) => candidate.classification !== 'different-feed').length,
        conflictCount: conflicts.length,
        recommendationCount: resolutionRecommendations.length,
      };

      const timing: DeduplicationTiming = {
        startedAt: new Date(startedAt).toISOString(),
        completedAt: new Date().toISOString(),
        totalMs: Date.now() - startedAt,
      };

      return {
        ...(canonicalFeed ? { canonicalFeed } : {}),
        duplicateCandidates,
        conflicts,
        resolutionRecommendations,
        confidenceScores,
        warnings,
        errors: [],
        statistics,
        timing,
        graph,
      };
    } catch (error) {
      throw new DuplicateDetectionError('Feed deduplication failed.', { feedCount: feeds.length }, error, 'Check the feed metadata and identity inputs.');
    }
  }

  private createEmptyResult(warnings: DeduplicationWarning[], startedAt: number): DeduplicationResult {
    return {
      duplicateCandidates: [],
      conflicts: [],
      resolutionRecommendations: [],
      confidenceScores: [],
      warnings,
      errors: [],
      statistics: { totalFeeds: 0, duplicateCount: 0, conflictCount: 0, recommendationCount: 0 },
      timing: { startedAt: new Date(startedAt).toISOString(), completedAt: new Date().toISOString(), totalMs: Date.now() - startedAt },
      graph: { nodes: [], edges: [] },
    };
  }
}
