import { FeedNormalizer } from '../../discovery/core';
import type { DeduplicationFeedCandidate, SimilarityScoreResult, SimilaritySignal } from '../types';
import { ScoringError, SimilarityError } from '../errors';
import type { ISimilarityScorer, IDuplicateDetector } from '../interfaces';

interface SimilarityWeightValues {
  canonicalUrl: number;
  normalizedUrl: number;
  websiteUrl: number;
  feedGuid: number;
  title: number;
  language: number;
  publisher: number;
  fingerprint: number;
  categories: number;
  artwork: number;
  description: number;
}

export class WeightedSimilarityScorer implements ISimilarityScorer {
  private readonly weights: Record<string, number>;

  constructor(weights?: Record<string, number>) {
    this.weights = {
      canonicalUrl: 0.22,
      normalizedUrl: 0.2,
      websiteUrl: 0.12,
      feedGuid: 0.14,
      title: 0.09,
      language: 0.05,
      publisher: 0.06,
      fingerprint: 0.12,
      categories: 0.04,
      artwork: 0.03,
      description: 0.03,
      ...weights,
    };
  }

  public async score(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate): Promise<SimilarityScoreResult> {
    try {
      const signals: SimilaritySignal[] = [];
      const weightValues = this.getWeightValues();
      const normalizer = new FeedNormalizer();
      const leftCanonical = this.normalizeValue(left.canonicalUrl || left.resolvedUrl || left.originalUrl);
      const rightCanonical = this.normalizeValue(right.canonicalUrl || right.resolvedUrl || right.originalUrl);
      const canonicalScore = this.compareValues(leftCanonical, rightCanonical);
      if (canonicalScore > 0) {
        signals.push({ name: 'canonicalUrl', value: `${leftCanonical}|${rightCanonical}`, weight: weightValues.canonicalUrl });
      }

      const leftNormalized = this.normalizeValue(left.identity?.normalizedUrl || leftCanonical);
      const rightNormalized = this.normalizeValue(right.identity?.normalizedUrl || rightCanonical);
      const normalizedUrlScore = this.compareValues(leftNormalized, rightNormalized);
      if (normalizedUrlScore > 0) {
        signals.push({ name: 'normalizedUrl', value: `${leftNormalized}|${rightNormalized}`, weight: weightValues.normalizedUrl });
      }

      const websiteScore = this.compareValues(this.normalizeValue(left.websiteUrl), this.normalizeValue(right.websiteUrl));
      if (websiteScore > 0) {
        signals.push({ name: 'websiteUrl', value: `${this.normalizeValue(left.websiteUrl)}|${this.normalizeValue(right.websiteUrl)}`, weight: weightValues.websiteUrl });
      }

      const guidScore = this.compareValues(this.normalizeValue(left.identity?.feedGuid), this.normalizeValue(right.identity?.feedGuid));
      if (guidScore > 0) {
        signals.push({ name: 'feedGuid', value: `${this.normalizeValue(left.identity?.feedGuid)}|${this.normalizeValue(right.identity?.feedGuid)}`, weight: weightValues.feedGuid });
      }

      const titleScore = this.compareValues(this.normalizeText(left.title), this.normalizeText(right.title));
      if (titleScore > 0) {
        signals.push({ name: 'title', value: `${this.normalizeText(left.title)}|${this.normalizeText(right.title)}`, weight: weightValues.title });
      }

      const languageScore = this.compareValues(this.normalizeText(left.language), this.normalizeText(right.language));
      if (languageScore > 0) {
        signals.push({ name: 'language', value: `${this.normalizeText(left.language)}|${this.normalizeText(right.language)}`, weight: weightValues.language });
      }

      const publisherScore = this.compareValues(this.normalizeText(left.publisher), this.normalizeText(right.publisher));
      if (publisherScore > 0) {
        signals.push({ name: 'publisher', value: `${this.normalizeText(left.publisher)}|${this.normalizeText(right.publisher)}`, weight: weightValues.publisher });
      }

      const fingerprintScore = this.compareValues(this.normalizeText(left.fingerprint), this.normalizeText(right.fingerprint));
      if (fingerprintScore > 0) {
        signals.push({ name: 'fingerprint', value: `${this.normalizeText(left.fingerprint)}|${this.normalizeText(right.fingerprint)}`, weight: weightValues.fingerprint });
      }

      const categoriesScore = this.compareStringArrays(left.categories, right.categories);
      if (categoriesScore > 0) {
        signals.push({ name: 'categories', value: `${(left.categories ?? []).join(',')}|${(right.categories ?? []).join(',')}`, weight: weightValues.categories });
      }

      const artworkScore = this.compareValues(this.normalizeValue(left.artworkUrl), this.normalizeValue(right.artworkUrl));
      if (artworkScore > 0) {
        signals.push({ name: 'artwork', value: `${this.normalizeValue(left.artworkUrl)}|${this.normalizeValue(right.artworkUrl)}`, weight: weightValues.artwork });
      }

      const descriptionScore = this.compareValues(this.normalizeText(left.description), this.normalizeText(right.description));
      if (descriptionScore > 0) {
        signals.push({ name: 'description', value: `${this.normalizeText(left.description)}|${this.normalizeText(right.description)}`, weight: weightValues.description });
      }

      const weightedSum = [
        canonicalScore * (weightValues.canonicalUrl ?? 0),
        normalizedUrlScore * (weightValues.normalizedUrl ?? 0),
        websiteScore * (weightValues.websiteUrl ?? 0),
        guidScore * (weightValues.feedGuid ?? 0),
        titleScore * (weightValues.title ?? 0),
        languageScore * (weightValues.language ?? 0),
        publisherScore * (weightValues.publisher ?? 0),
        fingerprintScore * (weightValues.fingerprint ?? 0),
        categoriesScore * (weightValues.categories ?? 0),
        artworkScore * (weightValues.artwork ?? 0),
        descriptionScore * (weightValues.description ?? 0),
      ].reduce((sum, value) => sum + value, 0);

      const totalWeight = Object.values(weightValues).reduce((sum, value) => sum + (value ?? 0), 0);
      const compositeScore = Math.min(1, Math.max(0, weightedSum / totalWeight));
      const reasons = signals.map((signal) => `${signal.name}:${signal.value}`);

      if (Number.isNaN(compositeScore)) {
        throw new SimilarityError('Similarity score became NaN.', { left: left.id, right: right.id });
      }

      return {
        score: compositeScore,
        normalizedScore: compositeScore,
        reasons,
        signals,
      };
    } catch (error) {
      throw new ScoringError('Unable to compute weighted similarity.', { left: left.id, right: right.id }, error, 'Validate the candidate metadata before scoring.');
    }
  }

  private compareValues(left?: string, right?: string): number {
    if (!left || !right) {
      return 0;
    }
    if (left === right) {
      return 1;
    }
    return 0;
  }

  private compareStringArrays(left?: readonly string[], right?: readonly string[]): number {
    if (!left?.length || !right?.length) {
      return 0;
    }
    const leftNormalized = new Set(left.map((value) => this.normalizeText(value)).filter(Boolean));
    const rightNormalized = new Set(right.map((value) => this.normalizeText(value)).filter(Boolean));
    const overlap = [...leftNormalized].filter((value) => rightNormalized.has(value));
    if (overlap.length === 0) {
      return 0;
    }
    return overlap.length / Math.max(leftNormalized.size, rightNormalized.size);
  }

  private normalizeValue(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const normalizer = new FeedNormalizer();
    return (normalizer as unknown as { normalizeUrl(value?: string): string | undefined }).normalizeUrl(value);
  }

  private getWeightValues(): SimilarityWeightValues {
    return {
      canonicalUrl: this.weights.canonicalUrl ?? 0,
      normalizedUrl: this.weights.normalizedUrl ?? 0,
      websiteUrl: this.weights.websiteUrl ?? 0,
      feedGuid: this.weights.feedGuid ?? 0,
      title: this.weights.title ?? 0,
      language: this.weights.language ?? 0,
      publisher: this.weights.publisher ?? 0,
      fingerprint: this.weights.fingerprint ?? 0,
      categories: this.weights.categories ?? 0,
      artwork: this.weights.artwork ?? 0,
      description: this.weights.description ?? 0,
    };
  }

  private normalizeText(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
  }
}

export class DuplicateDetector implements IDuplicateDetector {
  public async detect(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, similarity: SimilarityScoreResult): Promise<{
    classification: 'exact-duplicate' | 'strong-duplicate' | 'possible-duplicate' | 'related-feed' | 'different-feed' | 'unknown';
    confidence: number;
    reasons: readonly string[];
  }> {
    if (left.fingerprint && right.fingerprint && left.fingerprint === right.fingerprint) {
      return { classification: 'exact-duplicate', confidence: 0.99, reasons: ['fingerprints-match'] };
    }

    if (similarity.score >= 0.95) {
      return { classification: 'exact-duplicate', confidence: Math.max(0.9, similarity.score), reasons: similarity.reasons };
    }
    if (similarity.score >= 0.82) {
      return { classification: 'strong-duplicate', confidence: similarity.score, reasons: similarity.reasons };
    }
    if (similarity.score >= 0.62) {
      return { classification: 'possible-duplicate', confidence: similarity.score, reasons: similarity.reasons };
    }
    if (similarity.score >= 0.35) {
      return { classification: 'related-feed', confidence: similarity.score, reasons: similarity.reasons };
    }
    return { classification: 'different-feed', confidence: similarity.score, reasons: similarity.reasons };
  }
}
