import type { ConflictDetail, ConflictClassification, DeduplicationFeedCandidate } from '../types';
import { ConflictDetectionError } from '../errors';
import type { IConflictClassifier, IConflictDetector } from '../interfaces';

export class BasicConflictDetector implements IConflictDetector {
  public async detect(left: DeduplicationFeedCandidate, right: DeduplicationFeedCandidate): Promise<readonly ConflictDetail[]> {
    try {
      const conflicts: ConflictDetail[] = [];
      if (this.hasDifference(left.title, right.title)) {
        conflicts.push({ type: 'title', description: 'Different titles detected', classification: 'metadata-conflict', severity: 'warning' });
      }
      if (this.hasDifference(left.canonicalUrl, right.canonicalUrl)) {
        conflicts.push({ type: 'canonical-url', description: 'Different canonical URLs detected', classification: 'url-conflict', severity: 'warning' });
      }
      if (this.hasDifference(left.websiteUrl, right.websiteUrl)) {
        conflicts.push({ type: 'website-url', description: 'Different website URLs detected', classification: 'url-conflict', severity: 'warning' });
      }
      if (this.hasDifference(left.language, right.language)) {
        conflicts.push({ type: 'language', description: 'Different languages detected', classification: 'localization-conflict', severity: 'info' });
      }
      if (this.hasDifference(left.publisher, right.publisher)) {
        conflicts.push({ type: 'publisher', description: 'Different publishers detected', classification: 'publisher-conflict', severity: 'warning' });
      }
      if (this.hasDifference(left.description, right.description)) {
        conflicts.push({ type: 'description', description: 'Different descriptions detected', classification: 'content-conflict', severity: 'warning' });
      }
      if (this.hasDifference(left.identity?.feedGuid, right.identity?.feedGuid)) {
        conflicts.push({ type: 'guid', description: 'Different feed GUIDs detected', classification: 'identity-conflict', severity: 'warning' });
      }
      if (this.hasDifference(left.artworkUrl, right.artworkUrl)) {
        conflicts.push({ type: 'artwork', description: 'Different artwork detected', classification: 'metadata-conflict', severity: 'info' });
      }
      return conflicts;
    } catch (error) {
      throw new ConflictDetectionError('Unable to detect conflicts.', { left: left.id, right: right.id }, error, 'Inspect the candidate metadata shapes.');
    }
  }

  private hasDifference(left?: string, right?: string): boolean {
    if (!left || !right) {
      return false;
    }
    return left.trim().toLowerCase() !== right.trim().toLowerCase();
  }
}

export class SimpleConflictClassifier implements IConflictClassifier {
  public classify(conflict: ConflictDetail): ConflictClassification {
    return conflict.classification;
  }
}
