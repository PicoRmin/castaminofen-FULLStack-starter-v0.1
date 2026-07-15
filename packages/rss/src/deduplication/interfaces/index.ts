import type { ConflictDetail, ConflictClassification, DeduplicationFeedCandidate, DeduplicationResult, FeedIdentityGraph, ResolutionRecommendation, SimilarityScoreResult } from '../types';

export interface ISimilarityScorer {
  score(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate): Promise<SimilarityScoreResult>;
}

export interface IDuplicateDetector {
  detect(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, similarity: SimilarityScoreResult): Promise<{
    classification: 'exact-duplicate' | 'strong-duplicate' | 'possible-duplicate' | 'related-feed' | 'different-feed' | 'unknown';
    confidence: number;
    reasons: readonly string[];
  }>;
}

export interface IConflictDetector {
  detect(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate): Promise<readonly ConflictDetail[]>;
}

export interface IConflictClassifier {
  classify(conflict: ConflictDetail): ConflictClassification;
}

export interface IConflictResolver {
  resolve(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, conflicts: readonly ConflictDetail[]): Promise<readonly ResolutionRecommendation[]>;
}

export interface IIdentityGraphBuilder {
  build(feeds: readonly DeduplicationFeedCandidate[]): Promise<FeedIdentityGraph>;
}

export interface IDeduplicationService {
  deduplicate(feeds: readonly DeduplicationFeedCandidate[]): Promise<DeduplicationResult>;
}
