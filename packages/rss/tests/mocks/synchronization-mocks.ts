import type { ImportEvent, ImportRepositoryContract } from '../../src/import/types';
import type { FeedCheckpoint, FeedSynchronizationState } from '../../src/synchronization/types';
import type { SynchronizationPersistenceCoordinator, SynchronizationStateStore } from '../../src/synchronization/interfaces';
import type { SynchronizationEventHook, SynchronizationImportService } from '../../src/synchronization/interfaces';
import { getSynchronizationFixture } from '../fixtures/synchronization-fixtures';

export class InMemoryFeedRepository implements ImportRepositoryContract {
  public readonly podcasts: Array<Record<string, unknown>> = [];
  public readonly episodes: Array<Record<string, unknown>> = [];

  public async createPodcast(input: Record<string, unknown>): Promise<unknown> {
    const created = { id: `podcast:${this.podcasts.length + 1}`, ...input };
    this.podcasts.push(created);
    return created;
  }

  public async updatePodcast(id: string, input: Record<string, unknown>): Promise<unknown> {
    const index = this.podcasts.findIndex((podcast) => String(podcast.id) === id);
    if (index >= 0) {
      this.podcasts[index] = { ...this.podcasts[index], ...input, id };
      return this.podcasts[index];
    }
    return { id, ...input };
  }

  public async findPodcastByFeedId(feedId: string): Promise<unknown | null> {
    return this.podcasts.find((podcast) => String(podcast.feedId) === feedId) ?? null;
  }

  public async findPodcastByFeedUrl(url: string): Promise<unknown | null> {
    return this.podcasts.find((podcast) => String(podcast.url) === url) ?? null;
  }

  public async findPodcastByCanonicalUrl(url: string): Promise<unknown | null> {
    return this.podcasts.find((podcast) => String(podcast.canonicalUrl) === url) ?? null;
  }

  public async findPodcastByProviderId(providerId: string): Promise<unknown | null> {
    return this.podcasts.find((podcast) => String(podcast.providerId) === providerId) ?? null;
  }
}

export class InMemoryEpisodeRepository implements ImportRepositoryContract {
  public readonly episodes: Array<Record<string, unknown>> = [];

  public async createEpisode(input: Record<string, unknown>): Promise<unknown> {
    const created = { id: `episode:${this.episodes.length + 1}`, ...input };
    this.episodes.push(created);
    return created;
  }

  public async findEpisodeByGuid(podcastId: string, guid: string): Promise<unknown | null> {
    return this.episodes.find((episode) => String(episode.podcastId) === podcastId && String(episode.guid) === guid) ?? null;
  }

  public async findEpisodeByUrl(podcastId: string, url: string): Promise<unknown | null> {
    return this.episodes.find((episode) => String(episode.podcastId) === podcastId && String(episode.url) === url) ?? null;
  }

  public async findEpisodeByMediaUrl(podcastId: string, mediaUrl: string): Promise<unknown | null> {
    return this.episodes.find((episode) => String(episode.podcastId) === podcastId && String(episode.mediaUrl) === mediaUrl) ?? null;
  }
}

export class MockResolver {
  public constructor(private readonly fixtureId: string, private readonly options: { failDownload?: boolean } = {}) {}

  public async resolve(request: { url: string; capabilities?: readonly string[]; format?: string }): Promise<{
    provider?: {
      metadata?: { id?: string; name?: string; version?: string };
      supports?(url: string): boolean;
      download?(url: string): Promise<string>;
      parse?(input: string): Promise<unknown>;
    };
    score: number;
    strategyNames?: readonly string[];
    reasons?: readonly string[];
  }> {
    if (this.options.failDownload) {
      throw new Error('Download failed');
    }

    const fixture = getSynchronizationFixture(this.fixtureId);
    const fixtureId = this.fixtureId;
    const provider = {
      metadata: { id: 'mock-provider', name: 'Mock Provider', version: '1.0.0' },
      async download(_url: string): Promise<string> {
        return fixture.xml;
      },
      async parse(_input: string): Promise<unknown> {
        const parsed = {
          feed: {
            title: 'Imported Mock Feed',
            feedId: 'mock-feed',
            providerId: 'mock-provider',
            canonicalUrl: 'https://example.com',
            metadata: { fixtureId },
          },
          episodes: fixture.xml.includes('guid-1') || fixture.xml.includes('podcast-guid') || fixture.xml.includes('guid-')
            ? fixture.xml.match(/<guid>([^<]+)<\/guid>/g)?.map((value) => ({
                title: 'Imported Episode',
                guid: value.replace(/<guid>|<\/guid>/g, ''),
                canonicalUrl: 'https://example.com/episode',
                mediaUrl: 'https://example.com/audio.mp3',
                providerId: 'mock-provider',
              })) ?? []
            : [],
          metadata: { statistics: { provider: 'generic-rss-provider' } },
        };
        return parsed;
      },
    };

    return {
      provider,
      score: 1,
      strategyNames: ['default'],
      reasons: ['fixture-based provider'],
    };
  }
}

export class MockStateStore implements SynchronizationStateStore {
  private readonly states = new Map<string, unknown>();

  public async load(request: { feedId?: string; feedUrl?: string; correlationId?: string | undefined }): Promise<unknown> {
    return this.states.get(request.feedId ?? request.feedUrl ?? 'default');
  }

  public async save(state: unknown): Promise<void> {
    const entry = state as { feedId?: string; feedUrl?: string; id?: string };
    this.states.set(entry.feedId ?? entry.feedUrl ?? entry.id ?? 'default', state);
  }
}

export class MockPersistenceCoordinator implements SynchronizationPersistenceCoordinator {
  public readonly events: Array<Record<string, unknown>> = [];

  public async execute(request: {
    plan?: unknown | undefined;
    repositories?: readonly unknown[] | undefined;
    executionOrder?: readonly string[] | undefined;
    correlationId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    transactionOptions?: Record<string, unknown> | undefined;
  }): Promise<{
    success: boolean;
    committedEntities?: readonly string[];
    updatedEntities?: readonly string[];
    skippedEntities?: readonly string[];
    failedEntities?: readonly string[];
    warnings?: readonly unknown[];
    errors?: readonly unknown[];
    statistics?: Record<string, unknown>;
    durationMs?: number;
  }> {
    this.events.push({ correlationId: request.correlationId, metadata: request.metadata });
    return {
      success: true,
      committedEntities: ['podcast', 'episode'],
      updatedEntities: [],
      skippedEntities: [],
      failedEntities: [],
      warnings: [],
      errors: [],
      statistics: { committedEntities: 2, durationMs: 1 },
      durationMs: 1,
    };
  }
}

export class MockTelemetry {
  public readonly metrics: Array<Record<string, unknown>> = [];
  public readonly events: Array<Record<string, unknown>> = [];

  public recordMetric(name: string, value: number): void {
    this.metrics.push({ name, value });
  }

  public emitEvent(type: string, payload: Record<string, unknown> = {}): void {
    this.events.push({ type, payload });
  }
}

export class FaultInjectionController {
  private readonly failures = new Set<string>();

  public inject(failure: string): void {
    this.failures.add(failure);
  }

  public shouldFail(failure: string): boolean {
    return this.failures.has(failure);
  }

  public clear(): void {
    this.failures.clear();
  }
}

export class FaultInjectingImportService implements SynchronizationImportService {
  public constructor(private readonly delegate: SynchronizationImportService, private readonly controller: FaultInjectionController) {}

  public async import(request: {
    feedUrl: string;
    mode: string;
    correlationId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    options?: Record<string, unknown> | undefined;
  }): Promise<{
    success: boolean;
    createdEntities?: readonly string[];
    updatedEntities?: readonly string[];
    skippedEntities?: readonly string[];
    warnings?: readonly unknown[];
    conflicts?: readonly unknown[];
    errors?: readonly unknown[];
    statistics?: Record<string, unknown>;
    durationMs?: number;
    providerMetadata?: Record<string, unknown>;
    parserMetadata?: Record<string, unknown>;
    mode?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }> {
    if (this.controller.shouldFail('provider-unavailable')) {
      return {
        success: false,
        createdEntities: [],
        updatedEntities: [],
        skippedEntities: [],
        warnings: [],
        conflicts: [],
        errors: [{ code: 'provider-unavailable', message: 'Injected failure', stage: 'provider', entity: 'feed' }],
        statistics: { createdPodcasts: 0, updatedPodcasts: 0, createdEpisodes: 0, updatedEpisodes: 0, skippedEpisodes: 0, duplicateCount: 0, warningCount: 0, errorCount: 1, durationMs: 1 },
        durationMs: 1,
        providerMetadata: {},
        mode: request.mode,
        correlationId: request.correlationId,
        metadata: request.metadata,
      };
    }

    return this.delegate.import(request);
  }
}

export class RecordingEventHook {
  public readonly events: Array<Record<string, unknown>> = [];

  public async onEvent(event: { type: string; stage: string; message: string; timestamp?: number | undefined; context?: Record<string, unknown> | undefined }): Promise<void> {
    this.events.push(event);
  }
}

export function createCheckpointState(feedId: string, overrides: Partial<FeedSynchronizationState> = {}): FeedSynchronizationState {
  return {
    id: `state:${feedId}`,
    feedId,
    currentState: 'Completed',
    currentVersion: 1,
    failureCount: 0,
    successCount: 1,
    metadata: Object.freeze({ feedHash: 'hash-1' }),
    stateTimestamp: Date.now(),
    history: [],
    failureHistory: [],
    successHistory: [],
    warnings: [],
    ...overrides,
  } as FeedSynchronizationState;
}

export function createCheckpoint(feedId: string, overrides: Partial<FeedCheckpoint> = {}): FeedCheckpoint {
  return {
    id: `checkpoint:${feedId}:1`,
    feedId,
    version: 1,
    synchronizationVersion: 1,
    metadata: Object.freeze({ feedHash: 'hash-1' }),
    createdAt: Date.now(),
    valid: true,
    ...overrides,
  } as FeedCheckpoint;
}
