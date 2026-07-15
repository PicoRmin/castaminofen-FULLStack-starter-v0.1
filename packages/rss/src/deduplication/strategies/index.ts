import type { DeduplicationFeedCandidate, ConflictDetail, ResolutionRecommendation } from '../types';
import { ConflictResolutionError } from '../errors';
import type { IConflictResolver } from '../interfaces';

export class ResolutionStrategyRegistry {
  private readonly strategies: IConflictResolver[];

  constructor(strategies: readonly IConflictResolver[] = []) {
    this.strategies = [...strategies];
  }

  public add(strategy: IConflictResolver): void {
    this.strategies.push(strategy);
  }

  public async resolve(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, conflicts: readonly ConflictDetail[]): Promise<readonly ResolutionRecommendation[]> {
    const results: ResolutionRecommendation[] = [];
    for (const strategy of this.strategies) {
      const recommendations = await strategy.resolve(left, right, conflicts);
      results.push(...recommendations);
    }
    return results;
  }
}

export class PreferCanonicalUrlStrategy implements IConflictResolver {
  public async resolve(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, conflicts: readonly ConflictDetail[]): Promise<readonly ResolutionRecommendation[]> {
    try {
      const targetId = left.canonicalUrl && right.canonicalUrl && left.canonicalUrl === right.canonicalUrl ? left.id : '';
      return [
        {
          strategy: 'prefer-canonical-url',
          targetId: targetId || undefined,
          confidence: 0.8,
          reason: 'Canonical URLs align and should be preserved.',
          actions: ['Preserve canonical URL', 'Keep feed identity stable'],
        },
      ];
    } catch (error) {
      throw new ConflictResolutionError('Unable to resolve using canonical URL strategy.', { left: left.id, right: right.id }, error, 'Verify the canonical identifiers.');
    }
  }
}

export class PreferNewestMetadataStrategy implements IConflictResolver {
  public async resolve(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, conflicts: readonly ConflictDetail[]): Promise<readonly ResolutionRecommendation[]> {
    return [
      {
        strategy: 'prefer-newest-metadata',
        targetId: left.updatedAt && right.updatedAt && left.updatedAt >= right.updatedAt ? left.id : right.id,
        confidence: 0.72,
        reason: 'Newest metadata should be preserved when duplicates conflict.',
        actions: ['Prefer latest updated metadata', 'Retain most recent title and description'],
      },
    ];
  }
}

export class PreserveBothStrategy implements IConflictResolver {
  public async resolve(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate, conflicts: readonly ConflictDetail[]): Promise<readonly ResolutionRecommendation[]> {
    return [
      {
        strategy: 'preserve-both',
        targetId: undefined,
        confidence: 0.62,
        reason: 'The feeds appear related but not identical.',
        actions: ['Preserve both feeds', 'Route to manual review'],
      },
    ];
  }
}
