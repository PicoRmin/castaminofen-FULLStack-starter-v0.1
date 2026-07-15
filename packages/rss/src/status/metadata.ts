import type { FeedStatus, FeedStatusMetadata } from './types';

const FEED_STATUS_METADATA: Readonly<Record<FeedStatus, FeedStatusMetadata>> = {
  NEW: {
    code: 'NEW',
    displayName: 'New',
    description: 'Feed has been created and is awaiting registration.',
    severity: 'info',
    operationalCategory: 'draft',
    isActive: false,
    isTerminal: false,
    requiresValidation: true,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
  REGISTERED: {
    code: 'REGISTERED',
    displayName: 'Registered',
    description: 'Feed has been registered and can begin validation.',
    severity: 'info',
    operationalCategory: 'validation',
    isActive: false,
    isTerminal: false,
    requiresValidation: true,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
  VALIDATING: {
    code: 'VALIDATING',
    displayName: 'Validating',
    description: 'Feed validation is in progress.',
    severity: 'info',
    operationalCategory: 'validation',
    isActive: false,
    isTerminal: false,
    requiresValidation: true,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: false,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    displayName: 'Validation Failed',
    description: 'Feed validation failed and requires recovery.',
    severity: 'warning',
    operationalCategory: 'validation',
    isActive: false,
    isTerminal: false,
    requiresValidation: true,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: true,
    supportsRecovery: true,
  },
  READY: {
    code: 'READY',
    displayName: 'Ready',
    description: 'Feed is ready for import or activation.',
    severity: 'success',
    operationalCategory: 'operational',
    isActive: true,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: true,
    allowsImport: true,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: true,
    allowsRetry: false,
    supportsRecovery: false,
  },
  IMPORTING: {
    code: 'IMPORTING',
    displayName: 'Importing',
    description: 'Feed import is currently running.',
    severity: 'info',
    operationalCategory: 'operational',
    isActive: true,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: false,
    allowsImport: true,
    allowsEditing: false,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
  IMPORT_FAILED: {
    code: 'IMPORT_FAILED',
    displayName: 'Import Failed',
    description: 'Feed import failed and may require recovery.',
    severity: 'warning',
    operationalCategory: 'operational',
    isActive: true,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: false,
    allowsImport: true,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: true,
    supportsRecovery: true,
  },
  ACTIVE: {
    code: 'ACTIVE',
    displayName: 'Active',
    description: 'Feed is actively synchronized.',
    severity: 'success',
    operationalCategory: 'operational',
    isActive: true,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: true,
    allowsImport: true,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: true,
    allowsRetry: true,
    supportsRecovery: true,
  },
  SYNCING: {
    code: 'SYNCING',
    displayName: 'Syncing',
    description: 'Feed is currently synchronizing.',
    severity: 'info',
    operationalCategory: 'operational',
    isActive: true,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: true,
    allowsImport: false,
    allowsEditing: false,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
  SYNC_FAILED: {
    code: 'SYNC_FAILED',
    displayName: 'Sync Failed',
    description: 'Feed synchronization failed and may require recovery.',
    severity: 'warning',
    operationalCategory: 'operational',
    isActive: true,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: true,
    allowsImport: false,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: true,
    supportsRecovery: true,
  },
  PAUSED: {
    code: 'PAUSED',
    displayName: 'Paused',
    description: 'Feed synchronization is temporarily paused.',
    severity: 'warning',
    operationalCategory: 'inactive',
    isActive: false,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: true,
    allowsRetry: true,
    supportsRecovery: true,
  },
  DISABLED: {
    code: 'DISABLED',
    displayName: 'Disabled',
    description: 'Feed is disabled and will not process.',
    severity: 'warning',
    operationalCategory: 'inactive',
    isActive: false,
    isTerminal: false,
    requiresValidation: false,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: true,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: true,
  },
  ARCHIVED: {
    code: 'ARCHIVED',
    displayName: 'Archived',
    description: 'Feed has been archived and is not active.',
    severity: 'info',
    operationalCategory: 'terminal',
    isActive: false,
    isTerminal: true,
    requiresValidation: false,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: false,
    allowsDeletion: true,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
  DELETED: {
    code: 'DELETED',
    displayName: 'Deleted',
    description: 'Feed has been logically deleted.',
    severity: 'error',
    operationalCategory: 'terminal',
    isActive: false,
    isTerminal: true,
    requiresValidation: false,
    allowsSynchronization: false,
    allowsImport: false,
    allowsEditing: false,
    allowsDeletion: false,
    allowsScheduling: false,
    allowsRetry: false,
    supportsRecovery: false,
  },
};

export function getAllFeedStatusMetadata(): readonly FeedStatusMetadata[] {
  return Object.values(FEED_STATUS_METADATA);
}

export function getFeedStatusMetadata(status: FeedStatus | string): FeedStatusMetadata | undefined {
  const normalized = normalizeFeedStatus(status);
  return FEED_STATUS_METADATA[normalized as FeedStatus];
}

export function normalizeFeedStatus(status: FeedStatus | string): FeedStatus {
  const value = `${status ?? ''}`.trim().toUpperCase();
  if (value === 'DRAFT' || value === 'NEW') {
    return 'NEW';
  }
  if (value === 'PENDING') {
    return 'REGISTERED';
  }
  if (value === 'SUCCESS') {
    return 'READY';
  }
  if (value === 'FAILED' || value === 'FAILURE') {
    return 'SYNC_FAILED';
  }
  if (value === 'ACTIVE') {
    return 'ACTIVE';
  }
  if (value === 'DISABLED') {
    return 'DISABLED';
  }
  if (value === 'ARCHIVED') {
    return 'ARCHIVED';
  }
  if (value === 'DELETED') {
    return 'DELETED';
  }
  if (value === 'PAUSED') {
    return 'PAUSED';
  }
  return (value as FeedStatus) ?? 'NEW';
}
