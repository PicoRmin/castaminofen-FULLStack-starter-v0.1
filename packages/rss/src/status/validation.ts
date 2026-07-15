import type { FeedStatus } from './types';
import { getFeedStatusMetadata, normalizeFeedStatus } from './metadata';

const VALID_FEED_STATUS_VALUES: readonly FeedStatus[] = [
  'NEW',
  'REGISTERED',
  'VALIDATING',
  'VALIDATION_FAILED',
  'READY',
  'IMPORTING',
  'IMPORT_FAILED',
  'ACTIVE',
  'SYNCING',
  'SYNC_FAILED',
  'PAUSED',
  'DISABLED',
  'ARCHIVED',
  'DELETED',
];

export function isValidFeedStatus(status: FeedStatus | string): boolean {
  const normalized = normalizeFeedStatus(status);
  return VALID_FEED_STATUS_VALUES.includes(normalized as FeedStatus);
}

export function isTerminalFeedStatus(status: FeedStatus | string): boolean {
  return getFeedStatusMetadata(status)?.isTerminal ?? false;
}

export function isOperationalFeedStatus(status: FeedStatus | string): boolean {
  const metadata = getFeedStatusMetadata(status);
  return (
    metadata?.operationalCategory === 'operational' ||
    metadata?.operationalCategory === 'validation'
  );
}

export function canReceiveImports(status: FeedStatus | string): boolean {
  return getFeedStatusMetadata(status)?.allowsImport ?? false;
}

export function canSynchronize(status: FeedStatus | string): boolean {
  return getFeedStatusMetadata(status)?.allowsSynchronization ?? false;
}

export function canRetry(status: FeedStatus | string): boolean {
  return getFeedStatusMetadata(status)?.allowsRetry ?? false;
}

export function canRecover(status: FeedStatus | string): boolean {
  return getFeedStatusMetadata(status)?.supportsRecovery ?? false;
}

export function canBeDeleted(status: FeedStatus | string): boolean {
  return getFeedStatusMetadata(status)?.allowsDeletion ?? false;
}

export function canBeArchived(status: FeedStatus | string): boolean {
  return (
    getFeedStatusMetadata(status)?.code === 'ACTIVE' ||
    getFeedStatusMetadata(status)?.code === 'READY'
  );
}
