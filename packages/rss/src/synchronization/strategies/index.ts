import type { SynchronizationRequest, SynchronizationStateModel } from '../types';

export interface SynchronizationStrategyDecision {
  readonly shouldSync: boolean;
  readonly reason: string;
  readonly fingerprint: string | undefined;
  readonly status: 'full' | 'incremental' | 'preview' | 'validation' | 'dry-run' | 'unchanged';
}

export interface SynchronizationStrategy {
  readonly id: string;
  readonly description: string;
  execute(request: SynchronizationRequest, state?: SynchronizationStateModel): Promise<SynchronizationStrategyDecision>;
}

export class FullSynchronizationStrategy implements SynchronizationStrategy {
  public readonly id = 'full';
  public readonly description = 'Performs a full resynchronization of the feed state.';

  public async execute(request: SynchronizationRequest, state?: SynchronizationStateModel): Promise<SynchronizationStrategyDecision> {
    return { shouldSync: true, reason: 'Full synchronization requested.', status: 'full' as const, fingerprint: state?.lastFingerprint ?? `full:${request.feedId}` };
  }
}

export class IncrementalSynchronizationStrategy implements SynchronizationStrategy {
  public readonly id = 'incremental';
  public readonly description = 'Performs incremental synchronization using the last known fingerprint.';

  public async execute(request: SynchronizationRequest, state?: SynchronizationStateModel): Promise<SynchronizationStrategyDecision> {
    const fingerprint = state?.lastFingerprint;
    const shouldSync = !fingerprint || request.options?.force === true;
    const decision: SynchronizationStrategyDecision = {
      shouldSync,
      reason: fingerprint ? 'Following incremental synchronization path.' : 'No previous fingerprint exists.',
      status: (shouldSync ? 'incremental' : 'unchanged') as 'incremental' | 'unchanged',
      fingerprint: fingerprint ?? undefined,
    };
    return decision;
  }
}

export class MetadataSynchronizationStrategy implements SynchronizationStrategy {
  public readonly id = 'metadata';
  public readonly description = 'Synchronizes only metadata changes.';

  public async execute(): Promise<SynchronizationStrategyDecision> {
    return { shouldSync: true, reason: 'Metadata-only synchronization requested.', status: 'preview' as const, fingerprint: undefined };
  }
}

export class EpisodeSynchronizationStrategy implements SynchronizationStrategy {
  public readonly id = 'episode';
  public readonly description = 'Synchronizes episodes while leaving metadata untouched.';

  public async execute(): Promise<SynchronizationStrategyDecision> {
    return { shouldSync: true, reason: 'Episode synchronization requested.', status: 'incremental' as const, fingerprint: undefined };
  }
}

export class PreviewSynchronizationStrategy implements SynchronizationStrategy {
  public readonly id = 'preview';
  public readonly description = 'Executes a preview-only synchronization flow.';

  public async execute(): Promise<SynchronizationStrategyDecision> {
    return { shouldSync: true, reason: 'Preview mode requested.', status: 'preview' as const, fingerprint: undefined };
  }
}

export class ValidationSynchronizationStrategy implements SynchronizationStrategy {
  public readonly id = 'validation';
  public readonly description = 'Validates and reports without importing changes.';

  public async execute(): Promise<SynchronizationStrategyDecision> {
    return { shouldSync: false, reason: 'Validation-only mode requested.', status: 'validation' as const, fingerprint: undefined };
  }
}

export class DefaultSynchronizationStrategyRegistry {
  public static createDefault(): readonly SynchronizationStrategy[] {
    return [
      new FullSynchronizationStrategy(),
      new IncrementalSynchronizationStrategy(),
      new MetadataSynchronizationStrategy(),
      new EpisodeSynchronizationStrategy(),
      new PreviewSynchronizationStrategy(),
      new ValidationSynchronizationStrategy(),
    ];
  }
}
