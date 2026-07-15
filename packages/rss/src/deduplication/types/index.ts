export type DeduplicationClassification = 'exact-duplicate' | 'strong-duplicate' | 'possible-duplicate' | 'related-feed' | 'different-feed' | 'unknown';

export type ConflictClassification = 'identity-conflict' | 'metadata-conflict' | 'publisher-conflict' | 'content-conflict' | 'url-conflict' | 'version-conflict' | 'localization-conflict' | 'unknown-conflict';

export type ConflictType = 'title' | 'canonical-url' | 'website-url' | 'guid' | 'language' | 'publisher' | 'metadata' | 'categories' | 'artwork' | 'version' | 'identity' | 'description';

export type DeduplicationWarningCode = 'weak-confidence' | 'conflicting-metadata' | 'missing-identifiers' | 'ambiguous-publisher' | 'multiple-canonical-candidates' | 'unknown-relationships';

export type DeduplicationErrorCode = 'duplicate-detection-error' | 'conflict-detection-error' | 'conflict-resolution-error' | 'identity-graph-error' | 'similarity-error' | 'scoring-error';

export interface DeduplicationWarning {
  readonly code: DeduplicationWarningCode;
  readonly message: string;
  readonly stage: 'similarity' | 'duplicate' | 'conflict' | 'graph' | 'resolution';
  readonly severity: 'info' | 'warning' | 'high';
}

export interface DeduplicationErrorInfo {
  readonly code: DeduplicationErrorCode;
  readonly message: string;
  readonly stage: string;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;
  readonly recovery?: string;
}

export interface DeduplicationFeedCandidate {
  readonly id: string;
  readonly canonicalUrl?: string;
  readonly originalUrl?: string;
  readonly resolvedUrl?: string;
  readonly websiteUrl?: string;
  readonly title?: string;
  readonly language?: string;
  readonly publisher?: string;
  readonly description?: string;
  readonly categories?: readonly string[];
  readonly artworkUrl?: string;
  readonly fingerprint?: string;
  readonly identity?: {
    readonly primaryKey?: string;
    readonly confidence?: number;
    readonly canonicalUrl?: string;
    readonly normalizedUrl?: string;
    readonly feedGuid?: string;
    readonly websiteUrl?: string;
    readonly title?: string;
    readonly language?: string;
    readonly publisher?: string;
    readonly signals?: Array<{ type: string; value: string }>;
  };
  readonly metadata?: Record<string, unknown>;
  readonly updatedAt?: string;
  readonly episodeFingerprints?: readonly string[];
}

export interface SimilaritySignal {
  readonly name: string;
  readonly value?: string;
  readonly weight?: number;
}

export interface SimilarityScoreResult {
  readonly score: number;
  readonly normalizedScore: number;
  readonly reasons: readonly string[];
  readonly signals: readonly SimilaritySignal[];
}

export interface DuplicateCandidate {
  readonly leftId: string;
  readonly rightId: string;
  readonly classification: DeduplicationClassification;
  readonly confidence: number;
  readonly similarity: number;
  readonly reasons: readonly string[];
  readonly conflicts: readonly ConflictDetail[];
}

export interface ConflictDetail {
  readonly type: ConflictType;
  readonly description: string;
  readonly classification: ConflictClassification;
  readonly severity: 'info' | 'warning' | 'high';
}

export interface ResolutionRecommendation {
  readonly strategy: string;
  readonly targetId: string | undefined;
  readonly confidence: number;
  readonly reason: string;
  readonly actions: readonly string[];
}

export interface ConfidenceScore {
  readonly feedId: string;
  readonly score: number;
  readonly explanation: string;
  readonly level: 'high' | 'medium' | 'low';
}

export interface FeedIdentityNode {
  readonly id: string;
  readonly feed: DeduplicationFeedCandidate;
  readonly kind: 'canonical' | 'alias' | 'redirect' | 'merged' | 'related' | 'unknown';
}

export interface FeedIdentityEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly type: 'canonical' | 'alias' | 'redirect' | 'merged' | 'related' | 'unknown';
  readonly confidence: number;
}

export interface FeedIdentityGraph {
  readonly nodes: readonly FeedIdentityNode[];
  readonly edges: readonly FeedIdentityEdge[];
}

export interface DeduplicationStatistics {
  readonly totalFeeds: number;
  readonly duplicateCount: number;
  readonly conflictCount: number;
  readonly recommendationCount: number;
}

export interface DeduplicationTiming {
  readonly startedAt: string;
  readonly completedAt: string;
  readonly totalMs: number;
}

export interface DeduplicationOptions {
  readonly weights?: Record<string, number>;
}

export interface DeduplicationResult {
  readonly canonicalFeed?: DeduplicationFeedCandidate;
  readonly duplicateCandidates: readonly DuplicateCandidate[];
  readonly conflicts: readonly ConflictDetail[];
  readonly resolutionRecommendations: readonly ResolutionRecommendation[];
  readonly confidenceScores: readonly ConfidenceScore[];
  readonly warnings: readonly DeduplicationWarning[];
  readonly errors: readonly DeduplicationErrorInfo[];
  readonly statistics: DeduplicationStatistics;
  readonly timing: DeduplicationTiming;
  readonly graph: FeedIdentityGraph;
}
