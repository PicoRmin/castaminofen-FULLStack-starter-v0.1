import { type ConflictDetail } from '../conflicts';

export interface MergeStrategy {
  readonly name: string;
  evaluate(input: Record<string, unknown>, existing: Record<string, unknown>, conflicts: readonly ConflictDetail[]): { action: 'merge' | 'update' | 'replace' | 'ignore' | 'reject'; reason: string; confidence: 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown'; metadata?: Record<string, unknown> };
}

export class ConservativeMergeStrategy implements MergeStrategy {
  public readonly name = 'conservative';

  public evaluate(input: Record<string, unknown>, existing: Record<string, unknown>, conflicts: readonly ConflictDetail[]): { action: 'merge' | 'update' | 'replace' | 'ignore' | 'reject'; reason: string; confidence: 'Exact' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown'; metadata?: Record<string, unknown> } {
    if (conflicts.length > 0) {
      return { action: 'update', reason: 'Conflicts detected, so incoming values are applied conservatively.', confidence: 'Medium', metadata: { conflictCount: conflicts.length } };
    }
    return { action: 'merge', reason: 'No conflicts were detected.', confidence: 'High', metadata: { existingId: existing.id } };
  }
}
