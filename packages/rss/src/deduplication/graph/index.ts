import type { DeduplicationFeedCandidate, FeedIdentityEdge, FeedIdentityGraph, FeedIdentityNode } from '../types';
import { IdentityGraphError } from '../errors';
import type { IIdentityGraphBuilder } from '../interfaces';

export class InMemoryIdentityGraphBuilder implements IIdentityGraphBuilder {
  public async build(feeds: readonly DeduplicationFeedCandidate[]): Promise<FeedIdentityGraph> {
    try {
      const nodes: FeedIdentityNode[] = feeds.map((feed) => ({
        id: feed.id,
        feed,
        kind: this.classifyNode(feed),
      }));

      const edges: FeedIdentityEdge[] = [];
      for (let index = 0; index < nodes.length; index += 1) {
        for (let inner = index + 1; inner < nodes.length; inner += 1) {
          const left = nodes[index];
          const right = nodes[inner];
          if (!left || !right) {
            continue;
          }
          const relation = this.relate(left.feed, right.feed);
          if (relation) {
            edges.push({ fromId: left.id, toId: right.id, type: relation, confidence: relation === 'canonical' ? 0.9 : 0.5 });
          }
        }
      }

      return { nodes, edges };
    } catch (error) {
      throw new IdentityGraphError('Unable to build identity graph.', { feedCount: feeds.length }, error, 'Inspect candidate identifiers and metadata.');
    }
  }

  private classifyNode(feed: DeduplicationFeedCandidate): FeedIdentityNode['kind'] {
    if (feed.identity?.canonicalUrl && feed.canonicalUrl) {
      return 'canonical';
    }
    return feed.identity?.confidence && feed.identity.confidence > 0.8 ? 'alias' : 'unknown';
  }

  private relate(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate): FeedIdentityEdge['type'] | undefined {
    const leftCanonical = left.canonicalUrl || left.resolvedUrl || left.originalUrl;
    const rightCanonical = right.canonicalUrl || right.resolvedUrl || right.originalUrl;
    if (leftCanonical && rightCanonical && leftCanonical === rightCanonical) {
      return 'canonical';
    }
    if (left.websiteUrl && right.websiteUrl && left.websiteUrl === right.websiteUrl) {
      return 'related';
    }
    return undefined;
  }
}
