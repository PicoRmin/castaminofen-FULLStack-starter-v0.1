export type DifferenceKind =
  | 'AddedEpisode'
  | 'UpdatedEpisode'
  | 'RemovedEpisode'
  | 'MetadataUpdated'
  | 'FeedUpdated'
  | 'AuthorUpdated'
  | 'CategoryUpdated'
  | 'MediaUpdated'
  | 'NoChange';

export type DifferenceClassification =
  | 'Structural Change'
  | 'Metadata Change'
  | 'Episode Change'
  | 'Media Change'
  | 'Category Change'
  | 'Author Change'
  | 'No Change'
  | 'Unknown Change';

export type ComparisonConfidence = 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown';

export type ComparisonStrategyName =
  'hash' | 'guid' | 'version' | 'timestamp' | 'content' | 'metadata' | 'composite' | 'custom';

export interface ComparisonDifference {
  readonly kind: DifferenceKind;
  readonly classification: DifferenceClassification;
  readonly reason: string;
  readonly confidence: ComparisonConfidence;
  readonly previousValue: unknown;
  readonly currentValue: unknown;
  readonly affectedEntity: string;
  readonly entityType?: string;
  readonly strategy?: ComparisonStrategyName;
  readonly metadata?: Record<string, unknown>;
}

export interface ComparisonWarning {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly severity: 'warning' | 'info';
  readonly entity: string;
  readonly context?: Record<string, unknown>;
}

export interface ComparisonError {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly entity: string;
  readonly context?: Record<string, unknown>;
  readonly recovery?: string;
}

export interface ComparisonResult {
  readonly differences: readonly ComparisonDifference[];
  readonly warnings: readonly ComparisonWarning[];
  readonly errors: readonly ComparisonError[];
  readonly hasChanges: boolean;
  readonly summary: Readonly<Record<string, number | string | boolean>>;
}

export interface ComparisonSnapshot {
  readonly id: string;
  readonly feedId: string;
  readonly etag?: string;
  readonly lastModified?: string;
  readonly feedHash?: string;
  readonly snapshotHash?: string;
  readonly episodeHash?: string;
  readonly episodeCount?: number;
  readonly authors?: readonly string[];
  readonly categories?: readonly string[];
  readonly media?: readonly string[];
  readonly metadata?: Record<string, unknown>;
  readonly body?: string;
  readonly content?: string;
  readonly timestamp?: number;
  readonly version?: number;
  readonly guid?: string;
}

export interface ComparisonContext {
  readonly request: {
    readonly feedId: string;
    readonly feedUrl: string;
    readonly correlationId?: string;
    readonly metadata?: Record<string, unknown>;
  };
  readonly previousSnapshot?: ComparisonSnapshot;
  readonly currentSnapshot?: ComparisonSnapshot;
  readonly previousCheckpoint?: {
    readonly id?: string;
    readonly etag?: string;
    readonly lastModified?: string;
    readonly feedHash?: string;
    readonly snapshotHash?: string;
    readonly episodeCount?: number;
    readonly metadata?: Record<string, unknown>;
    readonly version?: number;
  };
  readonly currentCheckpoint?: {
    readonly id?: string;
    readonly etag?: string;
    readonly lastModified?: string;
    readonly feedHash?: string;
    readonly snapshotHash?: string;
    readonly episodeCount?: number;
    readonly metadata?: Record<string, unknown>;
    readonly version?: number;
  };
  readonly state?: {
    readonly feedId: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly currentVersion?: number;
  };
}

export interface ComparisonStrategy {
  readonly id: ComparisonStrategyName;
  readonly description: string;
  evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[];
}

export interface ConditionalDownloadRequest {
  readonly url: string;
  readonly ifNoneMatch?: string;
  readonly ifModifiedSince?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ConditionalDownloadResponse {
  readonly status: number;
  readonly notModified: boolean;
  readonly headers?: Record<string, string | undefined>;
  readonly body?: string;
  readonly snapshot?: ComparisonSnapshot;
  readonly metadata?: Record<string, unknown>;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly stage: string;
    readonly recovery?: string;
  };
}

export interface IncrementalImportOperation {
  readonly entityType:
    'feed' | 'episode' | 'author' | 'category' | 'media' | 'metadata' | 'snapshot';
  readonly action: 'create' | 'update' | 'delete' | 'skip';
  readonly entityId: string;
  readonly reason: string;
  readonly confidence: ComparisonConfidence;
  readonly metadata?: Record<string, unknown>;
}

export interface IncrementalImportPlan {
  readonly operations: readonly IncrementalImportOperation[];
  readonly changedEntities: readonly string[];
  readonly warnings: readonly ComparisonWarning[];
  readonly metadata?: Record<string, unknown>;
}
