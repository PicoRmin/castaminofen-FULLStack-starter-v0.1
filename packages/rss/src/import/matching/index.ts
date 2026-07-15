export type MatchStrategyName = 'guid' | 'canonical-url' | 'media-url' | 'provider-id' | 'stable-hash' | 'slug' | 'title-date' | 'custom';

export interface MatchCandidate {
  readonly id: string;
  readonly entityType: 'podcast' | 'episode' | 'media' | 'author' | 'category';
  readonly normalizedKey: string;
  readonly metadata?: Record<string, unknown>;
}

export interface MatchResult {
  readonly matched: boolean;
  readonly confidence: 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown';
  readonly strategy: MatchStrategyName;
  readonly reason: string;
  readonly candidate?: MatchCandidate;
  readonly warnings?: readonly string[];
}

export interface MatchStrategy {
  readonly name: MatchStrategyName;
  match(input: MatchCandidate, candidate: MatchCandidate): MatchResult;
}

export class ExactGuidStrategy implements MatchStrategy {
  public readonly name: MatchStrategyName = 'guid';

  public match(input: MatchCandidate, candidate: MatchCandidate): MatchResult {
    if (input.normalizedKey && candidate.normalizedKey && input.normalizedKey === candidate.normalizedKey) {
      return { matched: true, confidence: 'Exact', strategy: this.name, reason: 'Normalized GUIDs match exactly.' };
    }
    return { matched: false, confidence: 'Low', strategy: this.name, reason: 'GUID values do not match.', warnings: ['Weak identity match'] };
  }
}

export class CanonicalUrlStrategy implements MatchStrategy {
  public readonly name: MatchStrategyName = 'canonical-url';

  public match(input: MatchCandidate, candidate: MatchCandidate): MatchResult {
    if (input.normalizedKey && candidate.normalizedKey && input.normalizedKey === candidate.normalizedKey) {
      return { matched: true, confidence: 'Very High', strategy: this.name, reason: 'Canonical URLs match exactly.' };
    }
    return { matched: false, confidence: 'Low', strategy: this.name, reason: 'Canonical URLs differ.' };
  }
}

export class MatchEngine {
  private readonly strategies: readonly MatchStrategy[];

  constructor(strategies: readonly MatchStrategy[] = [new ExactGuidStrategy(), new CanonicalUrlStrategy()]) {
    this.strategies = strategies;
  }

  public match(input: MatchCandidate, candidate: MatchCandidate): MatchResult {
    for (const strategy of this.strategies) {
      const result = strategy.match(input, candidate);
      if (result.matched) {
        return result;
      }
    }
    return {
      matched: false,
      confidence: 'Unknown',
      strategy: 'custom',
      reason: 'No strategy produced an exact match.',
      warnings: ['Weak identity match'],
    };
  }
}
