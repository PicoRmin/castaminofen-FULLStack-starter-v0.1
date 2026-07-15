import type { DiscoveryNormalizedFeed, DiscoveryRequest, DiscoveryValidationResult, DiscoveryWarning } from '../types';
import { FeedValidationError } from '../errors';

export class FeedValidator {
  public async validate(request: DiscoveryRequest, feed: DiscoveryNormalizedFeed): Promise<DiscoveryValidationResult> {
    const errors: Array<{ code: 'feed-validation-error'; message: string; stage: string; context?: Record<string, unknown>; cause?: unknown; recovery?: string }> = [];
    const warnings: DiscoveryWarning[] = [];
    const checks: Record<string, boolean> = {
      xml: true,
      structure: Boolean(feed.title || feed.description || feed.language),
      version: Boolean(feed.version || request.rawContent?.includes('rss') || request.rawContent?.includes('feed')),
      requiredFields: Boolean(feed.title && feed.language),
      channel: Boolean(feed.title || feed.homepageUrl || feed.websiteUrl),
      episodeCollection: Boolean(feed.itemCount !== undefined),
      mediaUrls: Boolean(feed.mediaUrls?.length),
      language: Boolean(feed.language),
      metadataConsistency: true,
    };

    if (!request.rawContent || !request.rawContent.trim()) {
      errors.push(this.toError('Feed content is empty.', { originalUrl: request.originalUrl }));
      checks.xml = false;
    }

    if (!feed.title) {
      warnings.push(this.toWarning('missing-title', 'Feed title is missing.', 'validation', 'warning'));
      checks.requiredFields = false;
    }

    if (!feed.language) {
      warnings.push(this.toWarning('missing-language', 'Feed language is missing.', 'validation', 'warning'));
      checks.language = false;
    }

    if (!feed.homepageUrl && !feed.websiteUrl) {
      warnings.push(this.toWarning('weak-metadata', 'Feed homepage is missing.', 'validation', 'warning'));
    }

    if (request.rawContent && request.rawContent.length > 250000) {
      warnings.push(this.toWarning('large-feed', 'Feed content is large.', 'validation', 'info'));
    }

    if (request.httpResponse?.contentType && !/xml|rss|atom/i.test(request.httpResponse.contentType)) {
      warnings.push(this.toWarning('unexpected-mime-type', 'Unexpected MIME type.', 'validation', 'warning'));
    }

    if (!feed.title || !feed.language) {
      return {
        valid: false,
        errors,
        warnings,
        checks,
      };
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks,
    };
  }

  private toError(message: string, context?: Record<string, unknown>) {
    return {
      code: 'feed-validation-error' as const,
      message,
      stage: 'validation',
      ...(context !== undefined ? { context } : {}),
      recovery: 'Check the feed URL and payload format.',
    };
  }

  private toWarning(code: DiscoveryWarning['code'], message: string, stage: DiscoveryWarning['stage'], severity: DiscoveryWarning['severity']): DiscoveryWarning {
    return { code, message, stage, severity };
  }
}
