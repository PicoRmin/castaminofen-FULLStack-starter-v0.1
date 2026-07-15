import { ValidationEngine, type ImportEpisodeCandidate, type ImportPodcastCandidate } from '../validation';
import { MatchEngine, type MatchCandidate, type MatchResult } from '../matching';
import { ValidationEngineError } from '../validation/errors';

export type DecisionType = 'CreatePodcast' | 'UpdatePodcast' | 'CreateEpisode' | 'UpdateEpisode' | 'SkipEpisode' | 'MergeEpisode' | 'RejectEpisode' | 'RejectFeed';

export interface ImportDecision {
  readonly type: DecisionType;
  readonly reason: string;
  readonly confidence: 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown';
  readonly validationResult: {
    readonly valid: boolean;
    readonly errors: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[];
    readonly warnings: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[];
  };
  readonly matchedEntities: readonly string[];
  readonly conflicts: readonly { type: string; description: string; classification: string; severity: 'info' | 'warning' | 'high' }[];
  readonly warnings: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[];
  readonly metadata?: Record<string, unknown>;
}

export interface ImportPlan {
  readonly decisions: readonly ImportDecision[];
  readonly entitiesToCreate: readonly string[];
  readonly entitiesToUpdate: readonly string[];
  readonly entitiesToMerge: readonly string[];
  readonly entitiesToSkip: readonly string[];
  readonly rejectedEntities: readonly string[];
  readonly warnings: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[];
  readonly conflicts: readonly { type: string; description: string; classification: string; severity: 'info' | 'warning' | 'high' }[];
  readonly statistics: {
    readonly createdPodcasts: number;
    readonly updatedPodcasts: number;
    readonly createdEpisodes: number;
    readonly updatedEpisodes: number;
    readonly skippedEpisodes: number;
    readonly duplicateCount: number;
    readonly warningCount: number;
    readonly errorCount: number;
    readonly durationMs: number;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface ImportPlanInput {
  readonly podcast: ImportPodcastCandidate;
  readonly episodes: readonly ImportEpisodeCandidate[];
  readonly metadata?: Record<string, unknown>;
}

export class ImportDecisionEngine {
  private readonly validationEngine = new ValidationEngine();
  private readonly matchEngine = new MatchEngine();

  public async createPlan(input: ImportPlanInput): Promise<ImportPlan> {
    const startedAt = Date.now();
    const validation = this.validationEngine.validateFeed(input);
    if (!validation.valid) {
      throw new ValidationEngineError('The feed failed validation.', 'feed', { errors: validation.errors }, 'Fix invalid feed metadata before retrying.');
    }

    const podcastDecision = this.toPodcastDecision(input.podcast, validation);
    const episodeDecisions = input.episodes.map((episode) => this.toEpisodeDecision(episode, validation));
    const decisions = [podcastDecision, ...episodeDecisions];
    const warnings = [...validation.warnings];
    const conflicts = [] as Array<ImportDecision['conflicts'][number]>;

    return {
      decisions,
      entitiesToCreate: ['podcast', 'episode'],
      entitiesToUpdate: [],
      entitiesToMerge: [],
      entitiesToSkip: [],
      rejectedEntities: [],
      warnings,
      conflicts,
      statistics: {
        createdPodcasts: 1,
        updatedPodcasts: 0,
        createdEpisodes: episodeDecisions.length,
        updatedEpisodes: 0,
        skippedEpisodes: 0,
        duplicateCount: 0,
        warningCount: warnings.length,
        errorCount: validation.errors.length,
        durationMs: Date.now() - startedAt,
      },
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };
  }

  private toPodcastDecision(podcast: ImportPodcastCandidate, validation: { valid: boolean; errors: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[]; warnings: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[]; confidence: 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown'; metadata?: Record<string, unknown> }): ImportDecision {
    return {
      type: 'CreatePodcast',
      reason: 'Podcast satisfies validation requirements and has no conflicting identifiers.',
      confidence: 'High',
      validationResult: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      matchedEntities: [],
      conflicts: [],
      warnings: validation.warnings,
      metadata: { title: podcast.title },
    };
  }

  private toEpisodeDecision(episode: ImportEpisodeCandidate, validation: { valid: boolean; errors: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[]; warnings: readonly { code: string; message: string; stage: string; severity: 'error' | 'warning'; entity: string; context?: Record<string, unknown>; recovery?: string }[]; confidence: 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown'; metadata?: Record<string, unknown> }): ImportDecision {
    const candidate: MatchCandidate = {
      id: episode.guid ?? episode.canonicalUrl ?? episode.mediaUrl ?? episode.title,
      entityType: 'episode',
      normalizedKey: [episode.guid, episode.canonicalUrl, episode.mediaUrl].filter(Boolean).join('|'),
      metadata: { title: episode.title },
    };
    const matchResult: MatchResult = this.matchEngine.match(candidate, {
      id: 'existing-episode',
      entityType: 'episode',
      normalizedKey: [episode.guid, episode.canonicalUrl, episode.mediaUrl].filter(Boolean).join('|'),
      metadata: { title: episode.title },
    });
    const decisionType = 'CreateEpisode';
    return {
      type: decisionType,
      reason: matchResult.matched ? 'A matching episode identity was found.' : 'No existing episode identity matched the incoming episode; the engine will create a new episode.',
      confidence: matchResult.matched ? 'Very High' : 'High',
      validationResult: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      matchedEntities: matchResult.matched ? ['episode:existing-episode'] : [],
      conflicts: [],
      warnings: validation.warnings,
      metadata: { title: episode.title },
    };
  }
}
