export interface ConflictDetail {
  readonly type: string;
  readonly description: string;
  readonly classification: string;
  readonly severity: 'info' | 'warning' | 'high';
}

export class ConflictDetector {
  public detect(input: Record<string, unknown>, existing?: Record<string, unknown>): readonly ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    if (!existing) {
      return conflicts;
    }

    if (input.title && existing.title && String(input.title) !== String(existing.title)) {
      conflicts.push({ type: 'title', description: 'Title changed between incoming and existing entity.', classification: 'metadata-conflict', severity: 'warning' });
    }
    if (input.feedUrl && existing.feedUrl && String(input.feedUrl) !== String(existing.feedUrl)) {
      conflicts.push({ type: 'feed-url', description: 'Feed URL changed between incoming and existing entity.', classification: 'url-conflict', severity: 'warning' });
    }
    if (input.guid && existing.guid && String(input.guid) !== String(existing.guid)) {
      conflicts.push({ type: 'guid', description: 'GUID changed between incoming and existing entity.', classification: 'identity-conflict', severity: 'warning' });
    }
    return conflicts;
  }
}
