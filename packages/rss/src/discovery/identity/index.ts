import type { DiscoveryIdentity, DiscoveryNormalizedFeed, DiscoveryRequest } from '../types';
import { FeedIdentityError } from '../errors';

export class FeedIdentityResolver {
  public async resolve(request: DiscoveryRequest, feed: DiscoveryNormalizedFeed): Promise<DiscoveryIdentity> {
    const signals: Array<{ type: string; value: string }> = [];
    const values: string[] = [];

    const canonical = feed.canonicalUrl || feed.resolvedUrl || request.resolvedUrl || request.originalUrl;
    if (canonical) {
      signals.push({ type: 'canonical', value: canonical });
      values.push(canonical);
    }

    if (feed.websiteUrl) {
      signals.push({ type: 'website', value: feed.websiteUrl });
      values.push(feed.websiteUrl);
    }

    if (feed.title) {
      signals.push({ type: 'title', value: feed.title });
      values.push(feed.title);
    }

    if (feed.language) {
      signals.push({ type: 'language', value: feed.language });
      values.push(feed.language);
    }

    if (feed.publisher) {
      signals.push({ type: 'publisher', value: feed.publisher });
      values.push(feed.publisher);
    }

    const primaryKey = canonical || values[0] || request.originalUrl;
    if (!primaryKey) {
      throw new FeedIdentityError('Unable to resolve feed identity.', { originalUrl: request.originalUrl });
    }

    return {
      primaryKey,
      confidence: Math.min(0.95, 0.5 + signals.length * 0.1),
      ...(canonical !== undefined ? { canonicalUrl: canonical } : {}),
      ...(canonical !== undefined ? { normalizedUrl: canonical } : {}),
      ...(feed.canonicalUrl !== undefined ? { feedGuid: feed.canonicalUrl } : {}),
      ...(feed.websiteUrl !== undefined ? { websiteUrl: feed.websiteUrl } : {}),
      ...(feed.title !== undefined ? { title: feed.title } : {}),
      ...(feed.language !== undefined ? { language: feed.language } : {}),
      ...(feed.publisher !== undefined ? { publisher: feed.publisher } : {}),
      signals,
    };
  }
}
