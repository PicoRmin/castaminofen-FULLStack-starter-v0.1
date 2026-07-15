import type {
  ComparisonContext,
  ComparisonDifference,
  ComparisonError,
  ComparisonResult,
  ComparisonSnapshot,
  ComparisonStrategy,
  ComparisonWarning,
} from '../types';
import {
  ComparisonError as ComparisonEngineError,
  DifferenceEngineError,
} from '../errors/incremental';
import {
  CompositeComparisonStrategy,
  ContentComparisonStrategy,
  GuidComparisonStrategy,
  HashComparisonStrategy,
  MetadataComparisonStrategy,
  TimestampComparisonStrategy,
  VersionComparisonStrategy,
} from './strategies';

export interface ComparisonEngineDependencies {
  readonly strategies?: readonly ComparisonStrategy[];
}

export class ComparisonEngine {
  private readonly strategies: readonly ComparisonStrategy[];

  public constructor(dependencies: ComparisonEngineDependencies = {}) {
    this.strategies = dependencies.strategies ?? [
      new HashComparisonStrategy(),
      new GuidComparisonStrategy(),
      new VersionComparisonStrategy(),
      new TimestampComparisonStrategy(),
      new ContentComparisonStrategy(),
      new MetadataComparisonStrategy(),
      new CompositeComparisonStrategy(),
    ];
  }

  public async compare(context: ComparisonContext): Promise<ComparisonResult> {
    const warnings: ComparisonWarning[] = [];
    const errors: ComparisonError[] = [];
    try {
      const previousSnapshot = context.previousSnapshot;
      const currentSnapshot = context.currentSnapshot;
      if (!previousSnapshot || !currentSnapshot) {
        return {
          differences: [],
          warnings,
          errors,
          hasChanges: false,
          summary: { reason: 'missing-snapshot' },
        };
      }
      const differences = this.collectDifferences(previousSnapshot, currentSnapshot);
      if (differences.length === 0) {
        warnings.push(
          this.warning(
            'no-change',
            'No differences were detected between the previous and current snapshots.',
            'comparison',
            'info',
            'feed',
            { feedId: context.request.feedId },
          ),
        );
      }
      return {
        differences,
        warnings,
        errors,
        hasChanges: differences.length > 0,
        summary: {
          differenceCount: differences.length,
          warningCount: warnings.length,
          errorCount: errors.length,
          hasChanges: differences.length > 0,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown comparison failure';
      errors.push(
        this.error(
          'comparison-failed',
          message,
          'comparison',
          context.request.feedId,
          { feedId: context.request.feedId },
          'Re-run the comparison after validating the previous and current snapshots.',
        ),
      );
      throw new ComparisonEngineError(message, {
        feedId: context.request.feedId,
        context: { error: message },
      });
    }
  }

  private collectDifferences(
    previousSnapshot: ComparisonSnapshot,
    currentSnapshot: ComparisonSnapshot,
  ): readonly ComparisonDifference[] {
    const allDifferences: ComparisonDifference[] = [];
    for (const strategy of this.strategies) {
      const diff = strategy.evaluate(previousSnapshot, currentSnapshot);
      if (diff.length > 0) {
        allDifferences.push(...diff);
      }
    }
    return allDifferences;
  }

  private warning(
    code: string,
    message: string,
    stage: string,
    severity: 'warning' | 'info',
    entity: string,
    context?: Record<string, unknown>,
  ): ComparisonWarning {
    return Object.freeze({
      code,
      message,
      stage,
      severity,
      entity,
      ...(context !== undefined ? { context } : {}),
    });
  }

  private error(
    code: string,
    message: string,
    stage: string,
    feedId: string,
    context?: Record<string, unknown>,
    recovery?: string | undefined,
  ): ComparisonError {
    return Object.freeze({
      code,
      message,
      stage,
      entity: 'feed',
      ...(context !== undefined ? { context } : {}),
      ...(recovery !== undefined ? { recovery } : {}),
    });
  }
}

export class DifferenceEngine {
  public async compare(context: ComparisonContext): Promise<ComparisonResult> {
    const comparison = new ComparisonEngine();
    const result = await comparison.compare(context);
    if (result.errors.length > 0) {
      throw new DifferenceEngineError('Difference engine could not compare snapshots.', {
        feedId: context.request.feedId,
        context: result.errors[0] ? { error: result.errors[0] } : undefined,
      });
    }
    return result;
  }
}
