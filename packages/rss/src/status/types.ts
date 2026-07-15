export type FeedStatus =
  | 'NEW'
  | 'REGISTERED'
  | 'VALIDATING'
  | 'VALIDATION_FAILED'
  | 'READY'
  | 'IMPORTING'
  | 'IMPORT_FAILED'
  | 'ACTIVE'
  | 'SYNCING'
  | 'SYNC_FAILED'
  | 'PAUSED'
  | 'DISABLED'
  | 'ARCHIVED'
  | 'DELETED';

export interface FeedStatusMetadata {
  readonly code: FeedStatus;
  readonly displayName: string;
  readonly description: string;
  readonly severity: 'info' | 'warning' | 'error' | 'success';
  readonly operationalCategory: 'draft' | 'validation' | 'operational' | 'inactive' | 'terminal';
  readonly isActive: boolean;
  readonly isTerminal: boolean;
  readonly requiresValidation: boolean;
  readonly allowsSynchronization: boolean;
  readonly allowsImport: boolean;
  readonly allowsEditing: boolean;
  readonly allowsDeletion: boolean;
  readonly allowsScheduling: boolean;
  readonly allowsRetry: boolean;
  readonly supportsRecovery: boolean;
}

export interface FeedStatusMapping {
  readonly canonical: FeedStatus;
  readonly legacyValues: readonly string[];
  readonly normalizedValue: string;
}
