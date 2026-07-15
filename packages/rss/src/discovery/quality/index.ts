import type { DiscoveryNormalizedFeed, DiscoveryQualityAssessment, DiscoveryRequest, DiscoveryValidationResult, DiscoveryWarning } from '../types';

export class FeedQualityAssessor {
  public async assess(request: DiscoveryRequest, feed: DiscoveryNormalizedFeed, validation: DiscoveryValidationResult): Promise<DiscoveryQualityAssessment> {
    const warnings: DiscoveryWarning[] = [];
    const indicators: Record<string, boolean> = {
      title: Boolean(feed.title),
      description: Boolean(feed.description),
      language: Boolean(feed.language),
      categories: Boolean(feed.categories?.length),
      author: Boolean(feed.authors?.length || feed.publisher),
      images: Boolean(feed.mediaUrls?.length),
      publicationDates: Boolean(feed.updatedAt),
      completeness: Boolean(feed.title && feed.language && feed.description),
    };

    if (!feed.language) {
      warnings.push({ code: 'missing-language', message: 'Language metadata is missing.', stage: 'quality', severity: 'warning' });
    }
    if (!feed.description) {
      warnings.push({ code: 'missing-description', message: 'Description metadata is missing.', stage: 'quality', severity: 'info' });
    }
    if (!feed.mediaUrls?.length) {
      warnings.push({ code: 'missing-image', message: 'No media URLs were found.', stage: 'quality', severity: 'info' });
    }

    const score = Math.min(100, 40 + Object.values(indicators).filter(Boolean).length * 10);
    return {
      score,
      level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
      indicators,
      warnings,
    };
  }
}
