export type ImportMode = 'initial' | 'reimport' | 'manual' | 'preview' | 'validation';

export type DuplicateStrategyName =
  | 'guid'
  | 'feedId'
  | 'canonicalUrl'
  | 'episodeUrl'
  | 'mediaUrl'
  | 'providerId'
  | 'contentHash'
  | 'slug';

export interface ImportOptions {
  readonly dryRun?: boolean;
  readonly validateOnly?: boolean;
  readonly duplicateStrategyOrder?: readonly DuplicateStrategyName[];
  readonly preserveUnknownMetadata?: boolean;
  readonly normalizeCategories?: boolean;
  readonly normalizeAuthors?: boolean;
  readonly normalizeTags?: boolean;
  readonly transaction?: boolean;
}

export interface ImportRequest {
  readonly feedUrl: string;
  readonly providerId?: string;
  readonly mode: ImportMode;
  readonly options?: ImportOptions;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly requestedAt?: Date | string;
}

export interface ImportWarning {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly severity: 'warning' | 'info';
  readonly entity?: string;
  readonly context?: Record<string, unknown>;
}

export interface ImportConflict {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly entity: string;
  readonly context?: Record<string, unknown>;
  readonly resolution?: string;
}

export interface ImportErrorInfo {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly entity: string;
  readonly context?: Record<string, unknown>;
  readonly recovery?: string;
}

export interface ImportStatistics {
  readonly createdPodcasts: number;
  readonly updatedPodcasts: number;
  readonly createdEpisodes: number;
  readonly updatedEpisodes: number;
  readonly skippedEpisodes: number;
  readonly duplicateCount: number;
  readonly warningCount: number;
  readonly errorCount: number;
  readonly durationMs: number;
}

export interface ImportResult {
  readonly success: boolean;
  readonly importedPodcast?: {
    readonly id?: string;
    readonly title?: string;
    readonly source?: string;
  } | null;
  readonly importedEpisodes: readonly unknown[];
  readonly createdEntities: readonly string[];
  readonly updatedEntities: readonly string[];
  readonly skippedEntities: readonly string[];
  readonly warnings: readonly ImportWarning[];
  readonly conflicts: readonly ImportConflict[];
  readonly errors: readonly ImportErrorInfo[];
  readonly statistics: ImportStatistics;
  readonly durationMs: number;
  readonly providerMetadata?: Record<string, unknown>;
  readonly parserMetadata?: Record<string, unknown>;
  readonly mode: ImportMode;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ImportEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface ImportRepositoryContract {
  findPodcast?(query: Record<string, unknown>): Promise<unknown | null>;
  findPodcastByFeedUrl?(url: string): Promise<unknown | null>;
  findPodcastByCanonicalUrl?(url: string): Promise<unknown | null>;
  findPodcastByProviderId?(providerId: string): Promise<unknown | null>;
  findPodcastByFeedId?(feedId: string): Promise<unknown | null>;
  createPodcast(input: Record<string, unknown>): Promise<unknown>;
  updatePodcast(id: string, input: Record<string, unknown>): Promise<unknown>;
  findEpisode?(query: Record<string, unknown>): Promise<unknown | null>;
  findEpisodeByGuid?(podcastId: string, guid: string): Promise<unknown | null>;
  findEpisodeByUrl?(podcastId: string, url: string): Promise<unknown | null>;
  findEpisodeByMediaUrl?(podcastId: string, mediaUrl: string): Promise<unknown | null>;
  createEpisode(input: Record<string, unknown>): Promise<unknown>;
  updateEpisode(id: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface ImportServiceDependencies {
  readonly resolver: {
    resolve(request: { url: string; capabilities?: readonly string[]; format?: string }): Promise<{
      provider?: {
        metadata?: { id?: string; name?: string; version?: string };
        supports?(url: string): boolean;
        download?(url: string): Promise<string>;
        parse?(input: string): Promise<unknown>;
      };
      score: number;
      strategyNames?: readonly string[];
      reasons?: readonly string[];
    }>;
  };
  readonly feedRepository: ImportRepositoryContract;
  readonly episodeRepository: ImportRepositoryContract;
  readonly duplicateStrategyOrder?: readonly DuplicateStrategyName[];
  readonly transaction?: <T>(work: () => Promise<T>) => Promise<T>;
  readonly onEvent?: (event: ImportEvent) => void | Promise<void>;
}

export interface NormalizedFeedImport {
  readonly feed: {
    readonly title: string;
    readonly feedId?: string | undefined;
    readonly canonicalUrl?: string | undefined;
    readonly providerId?: string | undefined;
    readonly language?: string | undefined;
    readonly categories?: readonly string[] | undefined;
    readonly authors?: readonly string[] | undefined;
    readonly tags?: readonly string[] | undefined;
    readonly metadata?: Record<string, unknown> | undefined;
  };
  readonly episodes: readonly NormalizedEpisodeImport[];
  readonly warnings: readonly ImportWarning[];
  readonly parserMetadata?: Record<string, unknown>;
}

export interface NormalizedEpisodeImport {
  readonly title: string;
  readonly guid?: string | undefined;
  readonly canonicalUrl?: string | undefined;
  readonly mediaUrl?: string | undefined;
  readonly providerId?: string | undefined;
  readonly contentHash?: string | undefined;
  readonly publishedAt?: string | undefined;
  readonly categories?: readonly string[] | undefined;
  readonly authors?: readonly string[] | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}
