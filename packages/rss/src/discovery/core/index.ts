import { createHash } from 'node:crypto';
import type { DiscoveryFingerprint, DiscoveryHealthAssessment, DiscoveryIdentity, DiscoveryNormalizedFeed, DiscoveryQualityAssessment, DiscoveryRequest, DiscoveryResult, DiscoveryStatistics, DiscoveryTiming, DiscoveryValidationResult, DiscoveryWarning } from '../types';
import { FeedDiscoveryError, FingerprintError } from '../errors';
import { FeedValidator } from '../validators';
import { FeedIdentityResolver } from '../identity';
import { FeedQualityAssessor } from '../quality';
import { FeedHealthAssessor } from '../health';

export class FeedNormalizer {
  public async normalize(request: DiscoveryRequest): Promise<DiscoveryNormalizedFeed> {
    const normalizedUrl = this.normalizeUrl(request.resolvedUrl || request.originalUrl);
    const canonicalUrl = this.normalizeUrl(request.metadata?.canonicalUrl || normalizedUrl);
    const homepageUrl = this.normalizeUrl(request.metadata?.homepageUrl || request.metadata?.websiteUrl || request.metadata?.canonicalUrl || normalizedUrl);
    const websiteUrl = this.normalizeUrl(request.metadata?.websiteUrl || homepageUrl);
    const title = this.normalizeText(request.parserResult?.title as string | undefined, request.metadata?.title);
    const language = this.normalizeLanguage(request.parserResult?.language as string | undefined, request.metadata?.language);
    const version = this.normalizeText(request.parserResult?.version as string | undefined, request.metadata?.version);
    const generator = this.normalizeText(request.parserResult?.generator as string | undefined, request.metadata?.generator);
    const publisher = this.normalizeText(request.parserResult?.publisher as string | undefined, request.metadata?.publisher);
    const description = this.normalizeText(request.parserResult?.description as string | undefined, request.metadata?.description);
    const categories = this.normalizeStringArray(request.parserResult?.categories as readonly string[] | undefined, request.metadata?.categories as readonly string[] | undefined);
    const authors = this.normalizeStringArray(request.parserResult?.authors as readonly string[] | undefined, request.metadata?.authors as readonly string[] | undefined);
    const mediaUrls = this.normalizeStringArray(request.parserResult?.mediaUrls as readonly string[] | undefined, request.metadata?.mediaUrls as readonly string[] | undefined);
    const updatedAt = this.normalizeText(request.parserResult?.updatedAt as string | undefined, request.metadata?.updatedAt);

    const normalizedFeed: DiscoveryNormalizedFeed = {
      itemCount: typeof request.parserResult?.itemCount === 'number' ? request.parserResult.itemCount : 0,
    };

    if (canonicalUrl !== undefined) {
      normalizedFeed.canonicalUrl = canonicalUrl;
    }
    if (request.originalUrl) {
      normalizedFeed.originalUrl = request.originalUrl;
    }
    if (normalizedUrl !== undefined) {
      normalizedFeed.resolvedUrl = normalizedUrl;
    }
    if (homepageUrl !== undefined) {
      normalizedFeed.homepageUrl = homepageUrl;
    }
    if (websiteUrl !== undefined) {
      normalizedFeed.websiteUrl = websiteUrl;
    }
    if (title !== undefined) {
      normalizedFeed.title = title;
    }
    if (language !== undefined) {
      normalizedFeed.language = language;
    }
    if (version !== undefined) {
      normalizedFeed.version = version;
    }
    if (generator !== undefined) {
      normalizedFeed.generator = generator;
    }
    if (publisher !== undefined) {
      normalizedFeed.publisher = publisher;
    }
    if (description !== undefined) {
      normalizedFeed.description = description;
    }
    if (categories !== undefined) {
      normalizedFeed.categories = categories;
    }
    if (authors !== undefined) {
      normalizedFeed.authors = authors;
    }
    if (mediaUrls !== undefined) {
      normalizedFeed.mediaUrls = mediaUrls;
    }
    if (updatedAt !== undefined) {
      normalizedFeed.updatedAt = updatedAt;
    }

    return normalizedFeed;
  }

  private normalizeUrl(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    try {
      const url = new URL(value);
      url.hash = '';
      url.username = '';
      url.password = '';
      if (url.port === '80' && url.protocol === 'http:') {
        url.port = '';
      }
      if (url.port === '443' && url.protocol === 'https:') {
        url.port = '';
      }
      url.hostname = url.hostname.toLowerCase();
      url.protocol = url.protocol.toLowerCase();
      const pathname = url.pathname.replace(/\/+$|\/$/g, '');
      url.pathname = pathname || '/';
      return url.toString().replace(/\/$/, '');
    } catch {
      return value.trim();
    }
  }

  private normalizeText(...values: Array<string | undefined | null>): string | undefined {
    const text = values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (!text) {
      return undefined;
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  private normalizeLanguage(...values: Array<string | undefined | null>): string | undefined {
    const value = this.normalizeText(...values);
    if (!value) {
      return undefined;
    }
    return value.split(/[-_]/)[0]?.toLowerCase();
  }

  private normalizeStringArray(...values: Array<readonly string[] | undefined>): string[] | undefined {
    const entries = values.flatMap((value) => value ?? []);
    return Array.from(new Set(entries.map((entry) => entry.trim()).filter(Boolean)));
  }
}

export class FingerprintGenerator {
  public async generate(request: DiscoveryRequest, feed: DiscoveryNormalizedFeed, identity: DiscoveryIdentity): Promise<DiscoveryFingerprint> {
    const algorithm = request.fingerprintAlgorithm || 'sha256';
    const seed = [
      identity.primaryKey,
      feed.canonicalUrl || '',
      feed.websiteUrl || '',
      feed.title || '',
      feed.language || '',
      feed.publisher || '',
      feed.version || '',
      request.originalUrl,
    ].join('|');

    try {
      const value = createHash(algorithm).update(seed).digest('hex');
      return { value, algorithm, seed };
    } catch (error) {
      throw new FingerprintError('Unable to generate fingerprint.', { algorithm, seed }, error, 'Use a supported hashing algorithm.');
    }
  }
}

export class FeedDiscoveryService {
  private readonly normalizer = new FeedNormalizer();
  private readonly validator = new FeedValidator();
  private readonly identityResolver = new FeedIdentityResolver();
  private readonly qualityAssessor = new FeedQualityAssessor();
  private readonly healthAssessor = new FeedHealthAssessor();
  private readonly fingerprintGenerator = new FingerprintGenerator();

  public async discover(request: DiscoveryRequest): Promise<DiscoveryResult> {
    const startedAt = Date.now();
    try {
      const normalizedFeed = await this.normalizer.normalize(request);
      const validation = await this.validator.validate(request, normalizedFeed);
      const identity = await this.identityResolver.resolve(request, normalizedFeed);
      const quality = await this.qualityAssessor.assess(request, normalizedFeed, validation);
      const warnings = [...validation.warnings, ...quality.warnings];
      const health = await this.healthAssessor.assess(validation, quality, warnings);
      const fingerprint = await this.fingerprintGenerator.generate(request, normalizedFeed, identity);
      const timing: DiscoveryTiming = {
        startedAt: new Date(startedAt).toISOString(),
        completedAt: new Date().toISOString(),
        totalMs: Date.now() - startedAt,
      };

      const statistics: DiscoveryStatistics = {
        warningCount: warnings.length,
        errorCount: validation.errors.length,
        signalCount: identity.signals.length,
        qualityScore: quality.score,
      };

      const result: DiscoveryResult = {
        originalUrl: request.originalUrl,
        normalizedFeed,
        identity,
        fingerprint,
        validation,
        quality,
        health,
        warnings,
        errors: validation.errors,
        statistics,
        timing,
      };

      if (normalizedFeed.canonicalUrl !== undefined) {
        result.canonicalUrl = normalizedFeed.canonicalUrl;
      }
      if (normalizedFeed.resolvedUrl !== undefined) {
        result.resolvedUrl = normalizedFeed.resolvedUrl;
      }

      return result;
    } catch (error) {
      throw new FeedDiscoveryError('Feed discovery failed.', { originalUrl: request.originalUrl }, error, 'Verify the feed URL and payload.');
    }
  }
}
