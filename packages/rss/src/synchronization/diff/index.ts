import type {
  ComparisonDifference,
  ComparisonResult,
  ComparisonSnapshot,
  IncrementalImportPlan,
  IncrementalImportOperation,
} from '../types';

export class DiffEngine {
  public createImportPlan(
    differences: readonly ComparisonDifference[],
    snapshot: ComparisonSnapshot,
    currentSnapshot: ComparisonSnapshot,
  ): IncrementalImportPlan {
    const operations: IncrementalImportOperation[] = [];
    for (const difference of differences) {
      switch (difference.kind) {
        case 'AddedEpisode':
        case 'UpdatedEpisode':
          operations.push({
            entityType: 'episode',
            action: 'update',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        case 'RemovedEpisode':
          operations.push({
            entityType: 'episode',
            action: 'delete',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        case 'MetadataUpdated':
          operations.push({
            entityType: 'metadata',
            action: 'update',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        case 'FeedUpdated':
          operations.push({
            entityType: 'feed',
            action: 'update',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        case 'AuthorUpdated':
          operations.push({
            entityType: 'author',
            action: 'update',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        case 'CategoryUpdated':
          operations.push({
            entityType: 'category',
            action: 'update',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        case 'MediaUpdated':
          operations.push({
            entityType: 'media',
            action: 'update',
            entityId: `${difference.affectedEntity}:${difference.kind}`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
          break;
        default:
          operations.push({
            entityType: 'snapshot',
            action: 'skip',
            entityId: `${difference.affectedEntity}:NoChange`,
            reason: difference.reason,
            confidence: difference.confidence,
            metadata: { strategy: difference.strategy },
          });
      }
    }
    const changedEntities = Array.from(
      new Set(operations.map((operation) => operation.entityType)),
    );
    return {
      operations,
      changedEntities,
      warnings: [],
      metadata: { previousSnapshotId: snapshot.id, currentSnapshotId: currentSnapshot.id },
    };
  }
}
