import { HashingError } from './errors';

export type ConfidenceLevel = 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown';

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly severity: 'error' | 'warning';
  readonly entity: string;
  readonly context?: Record<string, unknown>;
  readonly recovery?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly confidence: ConfidenceLevel;
  readonly metadata?: Record<string, unknown>;
}

export interface IdentityResolution {
  readonly entity: 'podcast' | 'feed' | 'episode' | 'media' | 'author' | 'category';
  readonly strategy: string;
  readonly normalizedValue: string;
  readonly confidence: ConfidenceLevel;
  readonly reason: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ImportPodcastCandidate {
  readonly title: string;
  readonly feedId?: string;
  readonly feedUrl?: string;
  readonly canonicalUrl?: string;
  readonly providerId?: string;
  readonly language?: string;
  readonly categories?: readonly string[];
  readonly authors?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface ImportEpisodeCandidate {
  readonly title: string;
  readonly guid?: string;
  readonly canonicalUrl?: string;
  readonly mediaUrl?: string;
  readonly providerId?: string;
  readonly publishedAt?: string;
  readonly language?: string;
  readonly categories?: readonly string[];
  readonly authors?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export class ValidationEngine {
  public validatePodcast(podcast: ImportPodcastCandidate): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (!podcast.title || !podcast.title.trim()) {
      errors.push(this.issue('missing-title', 'Podcast title is required.', 'validation', 'error', 'podcast'));
    }
    if (!podcast.feedId || !podcast.feedId.trim()) {
      warnings.push(this.issue('missing-feed-id', 'Feed identifier is missing; the engine will rely on URL-based identity.', 'validation', 'warning', 'podcast'));
    }
    if (!podcast.feedUrl || !this.isHttpUrl(podcast.feedUrl)) {
      errors.push(this.issue('invalid-feed-url', 'Feed URL is required and must be a valid http(s) URL.', 'validation', 'error', 'feed'));
    }
    if (podcast.language && !this.isLanguageCode(podcast.language)) {
      warnings.push(this.issue('invalid-language', 'Language code is not in the expected format.', 'validation', 'warning', 'podcast', { language: podcast.language }));
    }
    if (!Array.isArray(podcast.categories) || podcast.categories.length === 0) {
      warnings.push(this.issue('missing-categories', 'No categories were supplied for the podcast.', 'validation', 'warning', 'podcast'));
    }
    if (!Array.isArray(podcast.authors) || podcast.authors.length === 0) {
      warnings.push(this.issue('missing-authors', 'No authors were supplied for the podcast.', 'validation', 'warning', 'podcast'));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: errors.length === 0 ? 'High' : 'Low',
      metadata: { title: podcast.title, feedUrl: podcast.feedUrl },
    };
  }

  public validateEpisode(episode: ImportEpisodeCandidate): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (!episode.title || !episode.title.trim()) {
      errors.push(this.issue('missing-title', 'Episode title is required.', 'validation', 'error', 'episode'));
    }
    if (episode.guid && !episode.guid.trim()) {
      errors.push(this.issue('invalid-guid', 'Episode GUID cannot be blank when present.', 'validation', 'error', 'episode'));
    }
    if (episode.mediaUrl && !this.isHttpUrl(episode.mediaUrl)) {
      errors.push(this.issue('invalid-media-url', 'Media URL must be a valid http(s) URL.', 'validation', 'error', 'media'));
    }
    if (episode.publishedAt && Number.isNaN(Date.parse(episode.publishedAt))) {
      errors.push(this.issue('invalid-published-at', 'Publication date is invalid.', 'validation', 'error', 'episode', { publishedAt: episode.publishedAt }));
    }
    if (episode.language && !this.isLanguageCode(episode.language)) {
      warnings.push(this.issue('invalid-language', 'Episode language code is not in the expected format.', 'validation', 'warning', 'episode', { language: episode.language }));
    }
    if (!Array.isArray(episode.categories) || episode.categories.length === 0) {
      warnings.push(this.issue('missing-categories', 'No categories were supplied for the episode.', 'validation', 'warning', 'episode'));
    }
    if (!Array.isArray(episode.authors) || episode.authors.length === 0) {
      warnings.push(this.issue('missing-authors', 'No authors were supplied for the episode.', 'validation', 'warning', 'episode'));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: errors.length === 0 ? 'High' : 'Low',
      metadata: { title: episode.title, guid: episode.guid },
    };
  }

  public validateFeed(input: { podcast: ImportPodcastCandidate; episodes: readonly ImportEpisodeCandidate[] }): ValidationResult {
    const podcast = this.validatePodcast(input.podcast);
    const episodeResults = input.episodes.map((episode) => this.validateEpisode(episode));
    const errors = [...podcast.errors, ...episodeResults.flatMap((entry) => entry.errors)];
    const warnings = [...podcast.warnings, ...episodeResults.flatMap((entry) => entry.warnings)];
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: errors.length === 0 ? 'High' : 'Low',
      metadata: { episodeCount: input.episodes.length },
    };
  }

  public hash(value: string, entity: string): string {
    try {
      let hash = 0x811c9dc5;
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
      }
      return (hash >>> 0).toString(16).padStart(8, '0');
    } catch {
      throw new HashingError(`Unable to hash ${entity}.`, entity, { value }, 'Retry with a stable string input.');
    }
  }

  private issue(code: string, message: string, stage: string, severity: 'error' | 'warning', entity: string, context?: Record<string, unknown>): ValidationIssue {
    return { code, message, stage, severity, entity, ...(context ? { context } : {}) };
  }

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isLanguageCode(value: string): boolean {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(value.trim());
  }
}

export class IdentityResolver {
  public resolvePodcastIdentity(podcast: ImportPodcastCandidate): IdentityResolution {
    const normalizedValue = [podcast.feedId, podcast.providerId, podcast.canonicalUrl, podcast.feedUrl, podcast.title].filter(Boolean).join('|');
    return {
      entity: 'podcast',
      strategy: 'canonical',
      normalizedValue: normalizedValue.trim(),
      confidence: normalizedValue.length > 0 ? 'High' : 'Unknown',
      reason: 'Resolved from feed identifier and canonical URL signals.',
      metadata: { title: podcast.title },
    };
  }

  public resolveFeedIdentity(podcast: ImportPodcastCandidate): IdentityResolution {
    return this.resolvePodcastIdentity(podcast);
  }

  public resolveEpisodeIdentity(episode: ImportEpisodeCandidate): IdentityResolution {
    const normalizedValue = [episode.guid, episode.canonicalUrl, episode.mediaUrl, episode.title].filter(Boolean).join('|');
    return {
      entity: 'episode',
      strategy: 'canonical',
      normalizedValue: normalizedValue.trim(),
      confidence: normalizedValue.length > 0 ? 'High' : 'Unknown',
      reason: 'Resolved from episode GUID and canonical URL signals.',
      metadata: { title: episode.title },
    };
  }

  public resolveMediaIdentity(episode: ImportEpisodeCandidate): IdentityResolution {
    const normalizedValue = [episode.mediaUrl, episode.canonicalUrl].filter(Boolean).join('|');
    return {
      entity: 'media',
      strategy: 'media-url',
      normalizedValue: normalizedValue.trim(),
      confidence: episode.mediaUrl ? 'High' : 'Unknown',
      reason: 'Resolved from media URL when available.',
      metadata: { mediaUrl: episode.mediaUrl },
    };
  }

  public resolveAuthorIdentity(value: string): IdentityResolution {
    return {
      entity: 'author',
      strategy: 'author-name',
      normalizedValue: value.trim().toLowerCase(),
      confidence: value ? 'Medium' : 'Unknown',
      reason: 'Normalized author names to a lower-case representation.',
    };
  }

  public resolveCategoryIdentity(value: string): IdentityResolution {
    return {
      entity: 'category',
      strategy: 'category-name',
      normalizedValue: value.trim().toLowerCase(),
      confidence: value ? 'Medium' : 'Unknown',
      reason: 'Normalized category names to a lower-case representation.',
    };
  }
}
