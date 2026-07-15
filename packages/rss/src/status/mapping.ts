import type { FeedStatus, FeedStatusMapping } from './types';
import { normalizeFeedStatus } from './metadata';

const LEGACY_FEED_STATUS_MAPPINGS: readonly FeedStatusMapping[] = [
  {
    canonical: 'NEW',
    legacyValues: ['draft', 'new', 'created'],
    normalizedValue: 'NEW',
  },
  {
    canonical: 'REGISTERED',
    legacyValues: ['pending', 'registered'],
    normalizedValue: 'REGISTERED',
  },
  {
    canonical: 'READY',
    legacyValues: ['success', 'ready'],
    normalizedValue: 'READY',
  },
  {
    canonical: 'SYNC_FAILED',
    legacyValues: ['failed', 'failure', 'error'],
    normalizedValue: 'SYNC_FAILED',
  },
  {
    canonical: 'DISABLED',
    legacyValues: ['disabled', 'inactive'],
    normalizedValue: 'DISABLED',
  },
  {
    canonical: 'ARCHIVED',
    legacyValues: ['archived'],
    normalizedValue: 'ARCHIVED',
  },
  {
    canonical: 'DELETED',
    legacyValues: ['deleted'],
    normalizedValue: 'DELETED',
  },
];

export function mapLegacyFeedStatus(status: FeedStatus | string): FeedStatus {
  const normalized = normalizeFeedStatus(status);
  return normalized;
}

export function getLegacyFeedStatusMappings(): readonly FeedStatusMapping[] {
  return LEGACY_FEED_STATUS_MAPPINGS;
}
