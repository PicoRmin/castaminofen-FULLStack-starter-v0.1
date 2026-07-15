import type {
  ImportConflict,
  ImportErrorInfo,
  ImportEvent,
  ImportRequest,
  ImportResult,
  ImportServiceDependencies,
  ImportWarning,
  NormalizedFeedImport,
  NormalizedEpisodeImport,
  DuplicateStrategyName,
} from './types';

const DEFAULT_DUPLICATE_STRATEGY_ORDER: readonly DuplicateStrategyName[] = [
  'guid',
  'feedId',
  'canonicalUrl',
  'episodeUrl',
  'mediaUrl',
  'providerId',
  'contentHash',
  'slug',
];

export class ImportService {
  private readonly duplicateStrategyOrder: readonly DuplicateStrategyName[];

  public constructor(private readonly dependencies: ImportServiceDependencies) {
    this.duplicateStrategyOrder = dependencies.duplicateStrategyOrder ?? DEFAULT_DUPLICATE_STRATEGY_ORDER;
  }

  public async import(request: ImportRequest): Promise<ImportResult> {
    const startedAt = Date.now();
    const warnings: ImportWarning[] = [];
    const conflicts: ImportConflict[] = [];
    const errors: ImportErrorInfo[] = [];
    const createdEntities: string[] = [];
    const updatedEntities: string[] = [];
    const skippedEntities: string[] = [];

    await this.emit({ type: 'import-started', stage: 'request', message: 'Import started', context: { feedUrl: request.feedUrl, mode: request.mode } });

    if (!request.feedUrl) {
      errors.push({ code: 'invalid-request', message: 'Feed URL is required.', stage: 'validation', entity: 'feed', recovery: 'Provide a valid feed URL.' });
      return this.failureResponse(startedAt, { warnings, conflicts, errors, createdEntities, updatedEntities, skippedEntities, mode: request.mode, ...(request.correlationId ? { correlationId: request.correlationId } : {}) });
    }

    const resolution = await this.dependencies.resolver.resolve({
      url: request.feedUrl,
      capabilities: ['rss', 'atom'],
      format: 'rss',
    });

    const provider = resolution.provider;
    if (!provider?.download || !provider.parse) {
      errors.push({ code: 'provider-unavailable', message: 'Resolved provider cannot download or parse the feed.', stage: 'provider', entity: 'feed', recovery: 'Use a provider that implements download and parse.' });
      return this.failureResponse(startedAt, { warnings, conflicts, errors, createdEntities, updatedEntities, skippedEntities, mode: request.mode, ...(request.correlationId ? { correlationId: request.correlationId } : {}) });
    }

    await this.emit({ type: 'provider-resolved', stage: 'provider', message: 'Provider resolved', context: { providerId: provider.metadata?.id } });

    const rawFeed = await provider.download(request.feedUrl);
    await this.emit({ type: 'feed-downloaded', stage: 'provider', message: 'Feed downloaded', context: { feedUrl: request.feedUrl } });

    const parsed = await provider.parse(rawFeed);
    const normalized = this.normalize(parsed);

    normalized.warnings.forEach((warning) => warnings.push(warning));
    await this.emit({ type: 'parsing-completed', stage: 'parser', message: 'Feed parsed', context: { feedUrl: request.feedUrl } });

    const existingPodcast = await this.findPodcast(request.feedUrl, normalized.feed.feedId, normalized.feed.providerId, normalized.feed.canonicalUrl);

    const shouldSkipPersistence = request.mode === 'preview' || request.mode === 'validation' || request.options?.dryRun || request.options?.validateOnly;

    const persistedPodcast = shouldSkipPersistence
      ? null
      : await this.executeTransaction(async () => {
          if (existingPodcast) {
            const updated = await this.dependencies.feedRepository.updatePodcast(String((existingPodcast as { id?: string }).id ?? ''), this.toPodcastPayload(normalized.feed, request));
            updatedEntities.push('podcast');
            return updated;
          }

          const created = await this.dependencies.feedRepository.createPodcast(this.toPodcastPayload(normalized.feed, request));
          createdEntities.push('podcast');
          return created;
        });

    const importedEpisodes: unknown[] = [];
    const podcastId = this.getId(persistedPodcast) ?? (existingPodcast ? this.getId(existingPodcast) : undefined);

    if (shouldSkipPersistence) {
      warnings.push({ code: 'preview-skip', message: 'Persistence skipped because the import is a preview or validation-only request.', stage: 'persist', severity: 'info', entity: 'feed' });
      return {
        success: true,
        importedPodcast: podcastId ? { id: podcastId, title: normalized.feed.title, source: request.feedUrl } : { title: normalized.feed.title, source: request.feedUrl },
        importedEpisodes,
        createdEntities,
        updatedEntities,
        skippedEntities,
        warnings,
        conflicts,
        errors,
        statistics: {
          createdPodcasts: 0,
          updatedPodcasts: 0,
          createdEpisodes: 0,
          updatedEpisodes: 0,
          skippedEpisodes: 0,
          duplicateCount: 0,
          warningCount: warnings.length,
          errorCount: errors.length,
          durationMs: Date.now() - startedAt,
        },
        durationMs: Date.now() - startedAt,
        providerMetadata: { providerId: provider.metadata?.id, score: resolution.score, reasons: resolution.reasons },
        ...(normalized.parserMetadata ? { parserMetadata: normalized.parserMetadata } : {}),
        mode: request.mode,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
        ...(request.metadata ? { metadata: request.metadata } : {}),
      };
    }

    for (const episode of normalized.episodes) {
      const duplicate = await this.detectEpisodeDuplicate(podcastId ?? '', episode);
      if (duplicate) {
        skippedEntities.push(`episode:${episode.guid ?? episode.title}`);
        warnings.push({ code: 'duplicate-episode', message: `Skipped duplicate episode ${episode.title ?? episode.guid ?? 'unknown'}.`, stage: 'duplicate', severity: 'warning', entity: 'episode', context: { title: episode.title, guid: episode.guid } });
        continue;
      }

      const payload = this.toEpisodePayload(episode, request, podcastId ?? 'preview');
      const persistedEpisode = await this.executeTransaction(async () => {
        const created = await this.dependencies.episodeRepository.createEpisode(payload);
        createdEntities.push('episode');
        return created;
      });
      importedEpisodes.push(persistedEpisode);
    }

    await this.emit({ type: 'import-completed', stage: 'persist', message: 'Import completed', context: { feedUrl: request.feedUrl, createdEntities, updatedEntities } });

    return {
      success: true,
      importedPodcast: podcastId ? { id: podcastId, title: normalized.feed.title, source: request.feedUrl } : { title: normalized.feed.title, source: request.feedUrl },
      importedEpisodes,
      createdEntities,
      updatedEntities,
      skippedEntities,
      warnings,
      conflicts,
      errors,
      statistics: {
        createdPodcasts: createdEntities.includes('podcast') ? 1 : 0,
        updatedPodcasts: updatedEntities.includes('podcast') ? 1 : 0,
        createdEpisodes: createdEntities.filter((entity) => entity === 'episode').length,
        updatedEpisodes: 0,
        skippedEpisodes: skippedEntities.filter((entity) => entity.startsWith('episode:')).length,
        duplicateCount: warnings.filter((warning) => warning.code === 'duplicate-episode').length,
        warningCount: warnings.length,
        errorCount: errors.length,
        durationMs: Date.now() - startedAt,
      },
      durationMs: Date.now() - startedAt,
      providerMetadata: { providerId: provider.metadata?.id, score: resolution.score, reasons: resolution.reasons },
      ...(normalized.parserMetadata ? { parserMetadata: normalized.parserMetadata } : {}),
      mode: request.mode,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.metadata ? { metadata: request.metadata } : {}),
    };
  }

  private async emit(event: ImportEvent): Promise<void> {
    await this.dependencies.onEvent?.(event);
  }

  private async executeTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.dependencies.transaction) {
      return this.dependencies.transaction(work);
    }
    return work();
  }

  private normalize(parsed: unknown): NormalizedFeedImport {
    const value = parsed as Record<string, unknown>;
    const feed = (value.feed as Record<string, unknown> | undefined) ?? {};
    const episodes = (value.episodes as readonly Record<string, unknown>[] | undefined) ?? [];

    const normalizedFeed = {
      title: String(feed.title ?? 'Untitled Podcast'),
      ...(typeof feed.feedId === 'string' ? { feedId: feed.feedId } : {}),
      ...(typeof feed.url === 'string' ? { canonicalUrl: feed.url } : {}),
      ...(typeof feed.providerId === 'string' ? { providerId: feed.providerId } : {}),
      ...(typeof feed.language === 'string' ? { language: feed.language } : {}),
      categories: Array.isArray(feed.categories) ? feed.categories.filter((item): item is string => typeof item === 'string') : [],
      authors: Array.isArray(feed.authors) ? feed.authors.filter((item): item is string => typeof item === 'string') : [],
      tags: Array.isArray(feed.tags) ? feed.tags.filter((item): item is string => typeof item === 'string') : [],
      ...(this.asRecord(feed.metadata) ? { metadata: this.asRecord(feed.metadata) } : {}),
    };

    const normalizedEpisodes = episodes.map((episode) => {
      const normalizedEpisode: NormalizedEpisodeImport = {
        title: String(episode.title ?? 'Untitled Episode'),
        ...(typeof episode.guid === 'string' ? { guid: episode.guid } : {}),
        ...(typeof episode.url === 'string' ? { canonicalUrl: episode.url } : {}),
        ...(typeof episode.audioUrl === 'string' ? { mediaUrl: episode.audioUrl } : {}),
        ...(typeof episode.providerId === 'string' ? { providerId: episode.providerId } : {}),
        ...(typeof episode.contentHash === 'string' ? { contentHash: episode.contentHash } : {}),
        ...(typeof episode.publishedAt === 'string' ? { publishedAt: episode.publishedAt } : {}),
        categories: Array.isArray(episode.categories) ? episode.categories.filter((item): item is string => typeof item === 'string') : [],
        authors: Array.isArray(episode.authors) ? episode.authors.filter((item): item is string => typeof item === 'string') : [],
        tags: Array.isArray(episode.tags) ? episode.tags.filter((item): item is string => typeof item === 'string') : [],
        ...(this.asRecord(episode.metadata) ? { metadata: this.asRecord(episode.metadata) } : {}),
      };
      return normalizedEpisode;
    });

    const parserMetadata = this.asRecord((value.metadata as Record<string, unknown> | undefined)?.statistics);

    return {
      feed: normalizedFeed,
      episodes: normalizedEpisodes,
      warnings: [],
      ...(parserMetadata ? { parserMetadata } : {}),
    };
  }

  private async findPodcast(feedUrl: string, feedId?: string, providerId?: string, canonicalUrl?: string): Promise<unknown | null> {
    if (feedId) {
      const byFeedId = await this.dependencies.feedRepository.findPodcastByFeedId?.(feedId);
      if (byFeedId) {
        return byFeedId;
      }
    }

    if (providerId) {
      const byProviderId = await this.dependencies.feedRepository.findPodcastByProviderId?.(providerId);
      if (byProviderId) {
        return byProviderId;
      }
    }

    if (canonicalUrl) {
      const byCanonicalUrl = await this.dependencies.feedRepository.findPodcastByCanonicalUrl?.(canonicalUrl);
      if (byCanonicalUrl) {
        return byCanonicalUrl;
      }
    }

    return this.dependencies.feedRepository.findPodcastByFeedUrl?.(feedUrl) ?? null;
  }

  private async detectEpisodeDuplicate(podcastId: string, episode: NormalizedEpisodeImport): Promise<boolean> {
    const strategies = this.duplicateStrategyOrder;

    for (const strategy of strategies) {
      switch (strategy) {
        case 'guid': {
          if (episode.guid) {
            const existing = await this.dependencies.episodeRepository.findEpisodeByGuid?.(podcastId, episode.guid);
            if (existing) {
              return true;
            }
          }
          break;
        }
        case 'episodeUrl': {
          if (episode.canonicalUrl) {
            const existing = await this.dependencies.episodeRepository.findEpisodeByUrl?.(podcastId, episode.canonicalUrl);
            if (existing) {
              return true;
            }
          }
          break;
        }
        case 'mediaUrl': {
          if (episode.mediaUrl) {
            const existing = await this.dependencies.episodeRepository.findEpisodeByMediaUrl?.(podcastId, episode.mediaUrl);
            if (existing) {
              return true;
            }
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    return false;
  }

  private toPodcastPayload(feed: NormalizedFeedImport['feed'], request: ImportRequest): Record<string, unknown> {
    return {
      title: feed.title,
      rssUrl: request.feedUrl,
      slug: feed.feedId ?? `feed-${Date.now()}`,
      description: undefined,
      language: feed.language,
      categories: feed.categories,
      authors: feed.authors,
      tags: feed.tags,
      metadata: feed.metadata,
    };
  }

  private toEpisodePayload(episode: NormalizedEpisodeImport, request: ImportRequest, podcastId: string): Record<string, unknown> {
    return {
      podcastId,
      title: episode.title,
      guid: episode.guid,
      slug: episode.guid ?? `episode-${Date.now()}`,
      audioUrl: episode.mediaUrl ?? request.feedUrl,
      url: episode.canonicalUrl,
      publishedAt: episode.publishedAt,
      categories: episode.categories,
      authors: episode.authors,
      tags: episode.tags,
      metadata: episode.metadata,
    };
  }

  private getId(value: unknown): string | undefined {
    if (typeof value === 'object' && value !== null && 'id' in value && typeof (value as { id?: unknown }).id === 'string') {
      return (value as { id?: string }).id;
    }
    return undefined;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private failureResponse(
    startedAt: number,
    context: {
      warnings: ImportWarning[];
      conflicts: ImportResult['conflicts'];
      errors: ImportResult['errors'];
      createdEntities: string[];
      updatedEntities: string[];
      skippedEntities: string[];
      mode: ImportRequest['mode'];
      correlationId?: string;
    },
  ): ImportResult {
    return {
      success: false,
      importedEpisodes: [],
      createdEntities: context.createdEntities,
      updatedEntities: context.updatedEntities,
      skippedEntities: context.skippedEntities,
      warnings: context.warnings,
      conflicts: context.conflicts,
      errors: context.errors,
      statistics: {
        createdPodcasts: 0,
        updatedPodcasts: 0,
        createdEpisodes: 0,
        updatedEpisodes: 0,
        skippedEpisodes: 0,
        duplicateCount: 0,
        warningCount: context.warnings.length,
        errorCount: context.errors.length,
        durationMs: Date.now() - startedAt,
      },
      durationMs: Date.now() - startedAt,
      mode: context.mode,
      ...(context.correlationId ? { correlationId: context.correlationId } : {}),
    };
  }
}
