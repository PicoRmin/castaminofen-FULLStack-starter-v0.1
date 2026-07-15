import type {
  ComparisonDifference,
  ComparisonSnapshot,
  ComparisonStrategy,
  ComparisonStrategyName,
} from '../types';

function makeDifference(
  kind: ComparisonDifference['kind'],
  classification: ComparisonDifference['classification'],
  reason: string,
  previousValue: unknown,
  currentValue: unknown,
  affectedEntity: string,
  strategy: ComparisonStrategyName,
  confidence: ComparisonDifference['confidence'],
  entityType = 'feed',
): ComparisonDifference {
  return {
    kind,
    classification,
    reason,
    confidence,
    previousValue,
    currentValue,
    affectedEntity,
    entityType,
    strategy,
  };
}

export class HashComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'hash';
  public readonly description = 'Compares feed hashes and snapshot hashes to detect content drift.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    const differences: ComparisonDifference[] = [];
    if (
      previousSnapshot.feedHash &&
      currentSnapshot.feedHash &&
      previousSnapshot.feedHash !== currentSnapshot.feedHash
    ) {
      differences.push(
        makeDifference(
          'FeedUpdated',
          'Structural Change',
          'Feed hash changed.',
          previousSnapshot.feedHash,
          currentSnapshot.feedHash,
          'feed',
          this.id,
          'High',
        ),
      );
    }
    if (
      previousSnapshot.snapshotHash &&
      currentSnapshot.snapshotHash &&
      previousSnapshot.snapshotHash !== currentSnapshot.snapshotHash
    ) {
      differences.push(
        makeDifference(
          'MetadataUpdated',
          'Metadata Change',
          'Snapshot hash changed.',
          previousSnapshot.snapshotHash,
          currentSnapshot.snapshotHash,
          'snapshot',
          this.id,
          'High',
          'snapshot',
        ),
      );
    }
    return differences;
  }
}

export class GuidComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'guid';
  public readonly description =
    'Compares GUID values when available to detect feed identity changes.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    if (
      previousSnapshot.guid &&
      currentSnapshot.guid &&
      previousSnapshot.guid !== currentSnapshot.guid
    ) {
      return [
        makeDifference(
          'FeedUpdated',
          'Structural Change',
          'Feed GUID changed.',
          previousSnapshot.guid,
          currentSnapshot.guid,
          'feed',
          this.id,
          'Medium',
        ),
      ];
    }
    return [];
  }
}

export class VersionComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'version';
  public readonly description = 'Compares the version metadata carried by the snapshots.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    if ((previousSnapshot.version ?? 0) !== (currentSnapshot.version ?? 0)) {
      return [
        makeDifference(
          'FeedUpdated',
          'Structural Change',
          'Snapshot version changed.',
          previousSnapshot.version ?? 0,
          currentSnapshot.version ?? 0,
          'feed',
          this.id,
          'Medium',
        ),
      ];
    }
    return [];
  }
}

export class TimestampComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'timestamp';
  public readonly description = 'Compares timestamps to detect fresh remote content.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    if ((previousSnapshot.timestamp ?? 0) !== (currentSnapshot.timestamp ?? 0)) {
      return [
        makeDifference(
          'MetadataUpdated',
          'Metadata Change',
          'Snapshot timestamp changed.',
          previousSnapshot.timestamp ?? 0,
          currentSnapshot.timestamp ?? 0,
          'metadata',
          this.id,
          'Low',
          'metadata',
        ),
      ];
    }
    return [];
  }
}

export class ContentComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'content';
  public readonly description = 'Compares content payloads and flags content drift.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    if (
      previousSnapshot.content &&
      currentSnapshot.content &&
      previousSnapshot.content !== currentSnapshot.content
    ) {
      return [
        makeDifference(
          'UpdatedEpisode',
          'Episode Change',
          'Feed content changed.',
          previousSnapshot.content,
          currentSnapshot.content,
          'episode',
          this.id,
          'High',
          'episode',
        ),
      ];
    }
    return [];
  }
}

export class MetadataComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'metadata';
  public readonly description = 'Compares feed metadata keys and values.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    const previousMetadata = previousSnapshot.metadata ?? {};
    const currentMetadata = currentSnapshot.metadata ?? {};
    const changedKeys = Object.keys({ ...previousMetadata, ...currentMetadata }).filter(
      (key) => previousMetadata[key] !== currentMetadata[key],
    );
    if (changedKeys.length > 0) {
      return [
        makeDifference(
          'MetadataUpdated',
          'Metadata Change',
          `Metadata keys changed: ${changedKeys.join(', ')}`,
          previousMetadata,
          currentMetadata,
          'metadata',
          this.id,
          'High',
          'metadata',
        ),
      ];
    }
    return [];
  }
}

export class CompositeComparisonStrategy implements ComparisonStrategy {
  public readonly id: ComparisonStrategyName = 'composite';
  public readonly description =
    'Creates a composite change signal if multiple lightweight checks disagree.';

  public evaluate(
    previousSnapshot: ComparisonSnapshot | undefined,
    currentSnapshot: ComparisonSnapshot | undefined,
  ): readonly ComparisonDifference[] {
    if (!previousSnapshot || !currentSnapshot) {
      return [];
    }
    const hasAuthorChanges =
      JSON.stringify(previousSnapshot.authors ?? []) !==
      JSON.stringify(currentSnapshot.authors ?? []);
    const hasCategoryChanges =
      JSON.stringify(previousSnapshot.categories ?? []) !==
      JSON.stringify(currentSnapshot.categories ?? []);
    const hasMediaChanges =
      JSON.stringify(previousSnapshot.media ?? []) !== JSON.stringify(currentSnapshot.media ?? []);
    if (hasAuthorChanges) {
      return [
        makeDifference(
          'AuthorUpdated',
          'Author Change',
          'Author list changed.',
          previousSnapshot.authors ?? [],
          currentSnapshot.authors ?? [],
          'author',
          this.id,
          'Medium',
          'author',
        ),
      ];
    }
    if (hasCategoryChanges) {
      return [
        makeDifference(
          'CategoryUpdated',
          'Category Change',
          'Category list changed.',
          previousSnapshot.categories ?? [],
          currentSnapshot.categories ?? [],
          'category',
          this.id,
          'Medium',
          'category',
        ),
      ];
    }
    if (hasMediaChanges) {
      return [
        makeDifference(
          'MediaUpdated',
          'Media Change',
          'Media list changed.',
          previousSnapshot.media ?? [],
          currentSnapshot.media ?? [],
          'media',
          this.id,
          'Medium',
          'media',
        ),
      ];
    }
    return [];
  }
}
