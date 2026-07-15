import { getFeedStatusMetadata, normalizeFeedStatus } from '../status';
import type { FeedStatus } from '../status';
import type {
  FeedLifecycleState,
  FeedLifecycleStateMetadata,
  FeedLifecycleTransitionCategory,
  FeedLifecycleTransitionDefinition,
  FeedLifecycleTransitionRegistry,
  FeedLifecycleTransitionType,
  FeedLifecycleTransitionVisibility,
  FeedLifecycleStateMachine,
} from './types';

function createTransitionDefinition(params: {
  id: string;
  from: FeedLifecycleState;
  to: FeedLifecycleState;
  displayName: string;
  description: string;
  category: FeedLifecycleTransitionCategory;
  operationalIntent: string;
  transitionType: FeedLifecycleTransitionType;
  visibility: FeedLifecycleTransitionVisibility;
  severity?: 'info' | 'warning' | 'error' | 'success';
  priority?: number;
  recoverable?: boolean;
  terminal?: boolean;
  requiresValidation?: boolean;
  supportsRetry?: boolean;
  supportsRecovery?: boolean;
  supportsScheduling?: boolean;
  supportsAutomation?: boolean;
  futureEventName?: string;
  futureMetricName?: string;
  futureAuditName?: string;
  futureNotificationName?: string;
  futureQueueName?: string;
}): FeedLifecycleTransitionDefinition {
  return {
    id: params.id,
    from: params.from,
    to: params.to,
    displayName: params.displayName,
    description: params.description,
    category: params.category,
    operationalIntent: params.operationalIntent,
    transitionType: params.transitionType,
    visibility: params.visibility,
    severity: params.severity ?? 'info',
    priority: params.priority ?? 100,
    recoverable: params.recoverable ?? false,
    terminal: params.terminal ?? false,
    requiresValidation: params.requiresValidation ?? false,
    supportsRetry: params.supportsRetry ?? false,
    supportsRecovery: params.supportsRecovery ?? false,
    supportsScheduling: params.supportsScheduling ?? false,
    supportsAutomation: params.supportsAutomation ?? false,
    futureEventName: params.futureEventName ?? undefined,
    futureMetricName: params.futureMetricName ?? undefined,
    futureAuditName: params.futureAuditName ?? undefined,
    futureNotificationName: params.futureNotificationName ?? undefined,
    futureQueueName: params.futureQueueName ?? undefined,
  };
}

const FEED_LIFECYCLE_TRANSITIONS: readonly FeedLifecycleTransitionDefinition[] = [
  createTransitionDefinition({
    id: 'new.registered',
    from: 'NEW',
    to: 'REGISTERED',
    displayName: 'Register feed',
    description: 'Initial registration of a newly created feed.',
    category: 'lifecycle',
    operationalIntent: 'registration',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'info',
    priority: 100,
    supportsAutomation: true,
    futureEventName: 'feed.registered',
  }),
  createTransitionDefinition({
    id: 'new.deleted',
    from: 'NEW',
    to: 'DELETED',
    displayName: 'Delete draft feed',
    description: 'Immediate deletion of a newly created feed.',
    category: 'administrative',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'info',
    priority: 90,
    supportsAutomation: false,
  }),
  createTransitionDefinition({
    id: 'registered.validating',
    from: 'REGISTERED',
    to: 'VALIDATING',
    displayName: 'Start validation',
    description: 'Start feed validation.',
    category: 'operational',
    operationalIntent: 'validation',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'info',
    priority: 95,
    requiresValidation: true,
    supportsAutomation: true,
    futureEventName: 'feed.validation.started',
  }),
  createTransitionDefinition({
    id: 'registered.ready',
    from: 'REGISTERED',
    to: 'READY',
    displayName: 'Validation succeeded',
    description: 'Validation completed successfully.',
    category: 'operational',
    operationalIntent: 'validation',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'success',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.validation.succeeded',
  }),
  createTransitionDefinition({
    id: 'registered.disabled',
    from: 'REGISTERED',
    to: 'DISABLED',
    displayName: 'Disable during setup',
    description: 'Disable a feed during setup.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 80,
  }),
  createTransitionDefinition({
    id: 'validating.ready',
    from: 'VALIDATING',
    to: 'READY',
    displayName: 'Validation completed',
    description: 'Validation completed successfully.',
    category: 'operational',
    operationalIntent: 'validation',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'success',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.validation.completed',
  }),
  createTransitionDefinition({
    id: 'validating.validation-failed',
    from: 'VALIDATING',
    to: 'VALIDATION_FAILED',
    displayName: 'Validation failed',
    description: 'Validation failed.',
    category: 'failure',
    operationalIntent: 'validation',
    transitionType: 'failure',
    visibility: 'internal',
    severity: 'warning',
    priority: 100,
    recoverable: true,
    supportsRetry: true,
    supportsRecovery: true,
    futureEventName: 'feed.validation.failed',
  }),
  createTransitionDefinition({
    id: 'validation-failed.validating',
    from: 'VALIDATION_FAILED',
    to: 'VALIDATING',
    displayName: 'Retry validation',
    description: 'Retry validation after a failure.',
    category: 'recovery',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
    severity: 'info',
    priority: 90,
    supportsRetry: true,
    supportsRecovery: true,
    futureEventName: 'feed.validation.retried',
  }),
  createTransitionDefinition({
    id: 'validation-failed.ready',
    from: 'VALIDATION_FAILED',
    to: 'READY',
    displayName: 'Recover to ready',
    description: 'Recover to a ready state.',
    category: 'recovery',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
    severity: 'success',
    priority: 90,
    supportsRecovery: true,
  }),
  createTransitionDefinition({
    id: 'ready.importing',
    from: 'READY',
    to: 'IMPORTING',
    displayName: 'Start import',
    description: 'Start importing feed content.',
    category: 'operational',
    operationalIntent: 'import',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'info',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.import.started',
  }),
  createTransitionDefinition({
    id: 'ready.active',
    from: 'READY',
    to: 'ACTIVE',
    displayName: 'Activate feed',
    description: 'Activate a ready feed.',
    category: 'operational',
    operationalIntent: 'activation',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'success',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.activated',
  }),
  createTransitionDefinition({
    id: 'ready.disabled',
    from: 'READY',
    to: 'DISABLED',
    displayName: 'Disable ready feed',
    description: 'Disable a ready feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 80,
  }),
  createTransitionDefinition({
    id: 'importing.active',
    from: 'IMPORTING',
    to: 'ACTIVE',
    displayName: 'Import completed',
    description: 'Import completed successfully.',
    category: 'operational',
    operationalIntent: 'import',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'success',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.import.completed',
  }),
  createTransitionDefinition({
    id: 'importing.import-failed',
    from: 'IMPORTING',
    to: 'IMPORT_FAILED',
    displayName: 'Import failed',
    description: 'Import failed.',
    category: 'failure',
    operationalIntent: 'import',
    transitionType: 'failure',
    visibility: 'internal',
    severity: 'warning',
    priority: 100,
    recoverable: true,
    supportsRetry: true,
    supportsRecovery: true,
    futureEventName: 'feed.import.failed',
  }),
  createTransitionDefinition({
    id: 'active.syncing',
    from: 'ACTIVE',
    to: 'SYNCING',
    displayName: 'Start synchronization',
    description: 'Begin synchronization.',
    category: 'operational',
    operationalIntent: 'synchronization',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'info',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.sync.started',
  }),
  createTransitionDefinition({
    id: 'active.paused',
    from: 'ACTIVE',
    to: 'PAUSED',
    displayName: 'Pause feed',
    description: 'Pause an active feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 80,
  }),
  createTransitionDefinition({
    id: 'active.disabled',
    from: 'ACTIVE',
    to: 'DISABLED',
    displayName: 'Disable feed',
    description: 'Disable an active feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 80,
  }),
  createTransitionDefinition({
    id: 'syncing.active',
    from: 'SYNCING',
    to: 'ACTIVE',
    displayName: 'Synchronization completed',
    description: 'Synchronization completed successfully.',
    category: 'operational',
    operationalIntent: 'synchronization',
    transitionType: 'normal',
    visibility: 'internal',
    severity: 'success',
    priority: 95,
    supportsAutomation: true,
    futureEventName: 'feed.sync.completed',
  }),
  createTransitionDefinition({
    id: 'syncing.sync-failed',
    from: 'SYNCING',
    to: 'SYNC_FAILED',
    displayName: 'Synchronization failed',
    description: 'Synchronization failed.',
    category: 'failure',
    operationalIntent: 'synchronization',
    transitionType: 'failure',
    visibility: 'internal',
    severity: 'warning',
    priority: 100,
    recoverable: true,
    supportsRetry: true,
    supportsRecovery: true,
    futureEventName: 'feed.sync.failed',
  }),
  createTransitionDefinition({
    id: 'sync-failed.active',
    from: 'SYNC_FAILED',
    to: 'ACTIVE',
    displayName: 'Recover to active',
    description: 'Recover to active after a sync failure.',
    category: 'recovery',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
    severity: 'success',
    priority: 90,
    supportsRecovery: true,
  }),
  createTransitionDefinition({
    id: 'sync-failed.ready',
    from: 'SYNC_FAILED',
    to: 'READY',
    displayName: 'Recover to ready',
    description: 'Recover to ready after a sync failure.',
    category: 'recovery',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
    severity: 'success',
    priority: 90,
    supportsRecovery: true,
  }),
  createTransitionDefinition({
    id: 'paused.active',
    from: 'PAUSED',
    to: 'ACTIVE',
    displayName: 'Resume feed',
    description: 'Resume a paused feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'success',
    priority: 80,
  }),
  createTransitionDefinition({
    id: 'disabled.active',
    from: 'DISABLED',
    to: 'ACTIVE',
    displayName: 'Re-enable feed',
    description: 'Re-enable a disabled feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'success',
    priority: 80,
  }),
  createTransitionDefinition({
    id: 'archived.active',
    from: 'ARCHIVED',
    to: 'ACTIVE',
    displayName: 'Restore archived feed',
    description: 'Restore an archived feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'success',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'archived.deleted',
    from: 'ARCHIVED',
    to: 'DELETED',
    displayName: 'Delete archived feed',
    description: 'Delete an archived feed.',
    category: 'administrative',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'active.archived',
    from: 'ACTIVE',
    to: 'ARCHIVED',
    displayName: 'Archive active feed',
    description: 'Archive an active feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'active.ready',
    from: 'ACTIVE',
    to: 'READY',
    displayName: 'Move to ready',
    description: 'Move an active feed back to ready.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'info',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'ready.archived',
    from: 'READY',
    to: 'ARCHIVED',
    displayName: 'Archive ready feed',
    description: 'Archive a ready feed.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'ready.deleted',
    from: 'READY',
    to: 'DELETED',
    displayName: 'Delete ready feed',
    description: 'Delete a ready feed.',
    category: 'administrative',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'active.deleted',
    from: 'ACTIVE',
    to: 'DELETED',
    displayName: 'Delete active feed',
    description: 'Delete an active feed.',
    category: 'administrative',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'paused.deleted',
    from: 'PAUSED',
    to: 'DELETED',
    displayName: 'Delete paused feed',
    description: 'Delete a paused feed.',
    category: 'administrative',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'disabled.deleted',
    from: 'DISABLED',
    to: 'DELETED',
    displayName: 'Delete disabled feed',
    description: 'Delete a disabled feed.',
    category: 'administrative',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'warning',
    priority: 70,
  }),
  createTransitionDefinition({
    id: 'archived.ready',
    from: 'ARCHIVED',
    to: 'READY',
    displayName: 'Restore to ready',
    description: 'Restore an archived feed to ready.',
    category: 'administrative',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
    severity: 'info',
    priority: 70,
  }),
];

function buildTransitionRegistry(): FeedLifecycleTransitionRegistry {
  const registry = new Map<FeedLifecycleState, readonly FeedLifecycleTransitionDefinition[]>();
  for (const transition of FEED_LIFECYCLE_TRANSITIONS) {
    const nextStates = registry.get(transition.from) ?? [];
    registry.set(transition.from, [...nextStates, transition]);
  }
  return registry;
}

const FEED_LIFECYCLE_STATE_METADATA: Readonly<
  Record<FeedLifecycleState, FeedLifecycleStateMetadata>
> = {
  NEW: {
    code: 'NEW',
    displayName: 'New',
    description: 'Feed created but not yet registered.',
    classification: 'initial',
    terminal: false,
    recoverable: false,
    operationalCategory: 'draft',
  },
  REGISTERED: {
    code: 'REGISTERED',
    displayName: 'Registered',
    description: 'Feed registered and ready for validation.',
    classification: 'initial',
    terminal: false,
    recoverable: false,
    operationalCategory: 'validation',
  },
  VALIDATING: {
    code: 'VALIDATING',
    displayName: 'Validating',
    description: 'Validation in progress.',
    classification: 'temporary',
    terminal: false,
    recoverable: false,
    operationalCategory: 'validation',
  },
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    displayName: 'Validation Failed',
    description: 'Validation failed and requires recovery.',
    classification: 'failure',
    terminal: false,
    recoverable: true,
    operationalCategory: 'validation',
  },
  READY: {
    code: 'READY',
    displayName: 'Ready',
    description: 'Feed is ready for import or activation.',
    classification: 'operational',
    terminal: false,
    recoverable: false,
    operationalCategory: 'operational',
  },
  IMPORTING: {
    code: 'IMPORTING',
    displayName: 'Importing',
    description: 'Feed import is currently running.',
    classification: 'temporary',
    terminal: false,
    recoverable: false,
    operationalCategory: 'operational',
  },
  IMPORT_FAILED: {
    code: 'IMPORT_FAILED',
    displayName: 'Import Failed',
    description: 'Feed import failed and may require recovery.',
    classification: 'failure',
    terminal: false,
    recoverable: true,
    operationalCategory: 'operational',
  },
  ACTIVE: {
    code: 'ACTIVE',
    displayName: 'Active',
    description: 'Feed is actively synchronized.',
    classification: 'operational',
    terminal: false,
    recoverable: true,
    operationalCategory: 'operational',
  },
  SYNCING: {
    code: 'SYNCING',
    displayName: 'Syncing',
    description: 'Feed is currently synchronizing.',
    classification: 'temporary',
    terminal: false,
    recoverable: false,
    operationalCategory: 'operational',
  },
  SYNC_FAILED: {
    code: 'SYNC_FAILED',
    displayName: 'Sync Failed',
    description: 'Synchronization failed and may require recovery.',
    classification: 'failure',
    terminal: false,
    recoverable: true,
    operationalCategory: 'operational',
  },
  PAUSED: {
    code: 'PAUSED',
    displayName: 'Paused',
    description: 'Synchronization temporarily paused.',
    classification: 'administrative',
    terminal: false,
    recoverable: true,
    operationalCategory: 'inactive',
  },
  DISABLED: {
    code: 'DISABLED',
    displayName: 'Disabled',
    description: 'Feed disabled and will not process.',
    classification: 'administrative',
    terminal: false,
    recoverable: true,
    operationalCategory: 'inactive',
  },
  ARCHIVED: {
    code: 'ARCHIVED',
    displayName: 'Archived',
    description: 'Feed archived and no longer active.',
    classification: 'terminal',
    terminal: true,
    recoverable: false,
    operationalCategory: 'terminal',
  },
  DELETED: {
    code: 'DELETED',
    displayName: 'Deleted',
    description: 'Feed logically deleted.',
    classification: 'terminal',
    terminal: true,
    recoverable: false,
    operationalCategory: 'terminal',
  },
};

let transitionRegistry: FeedLifecycleTransitionRegistry | undefined;
let stateMachine: FeedLifecycleStateMachine | undefined;

export function getFeedLifecycleTransitionRegistry(): FeedLifecycleTransitionRegistry {
  transitionRegistry ??= buildTransitionRegistry();
  return transitionRegistry;
}

export function getFeedLifecycleStateMetadata(
  state: FeedLifecycleState | string,
): FeedLifecycleStateMetadata | undefined {
  const normalized = normalizeFeedStatus(state) as FeedLifecycleState;
  return FEED_LIFECYCLE_STATE_METADATA[normalized];
}

export function getFeedLifecycleStateMachine(): FeedLifecycleStateMachine {
  stateMachine ??= {
    canTransition(
      fromState: FeedLifecycleState | string,
      toState: FeedLifecycleState | string,
    ): boolean {
      const from = normalizeFeedStatus(fromState) as FeedLifecycleState;
      const to = normalizeFeedStatus(toState) as FeedLifecycleState;
      const allowedTransitions = getFeedLifecycleTransitionRegistry().get(from) ?? [];
      return allowedTransitions.some((transition) => transition.to === to);
    },
    transition(
      fromState: FeedLifecycleState | string,
      toState: FeedLifecycleState | string,
    ): FeedLifecycleState {
      const from = normalizeFeedStatus(fromState) as FeedLifecycleState;
      const to = normalizeFeedStatus(toState) as FeedLifecycleState;
      if (!stateMachine?.canTransition(from, to)) {
        throw new Error(`Invalid state transition from ${from} to ${to}`);
      }
      return to;
    },
    getMetadata(state: FeedLifecycleState | string): FeedLifecycleStateMetadata | undefined {
      return getFeedLifecycleStateMetadata(state);
    },
    getTransitions(state: FeedLifecycleState | string): readonly FeedLifecycleState[] {
      const normalized = normalizeFeedStatus(state) as FeedLifecycleState;
      return (getFeedLifecycleTransitionRegistry().get(normalized) ?? []).map(
        (transition) => transition.to,
      );
    },
  };
  return stateMachine;
}

export function getFeedLifecycleTransitionDefinitions(): readonly FeedLifecycleTransitionDefinition[] {
  return FEED_LIFECYCLE_TRANSITIONS;
}

export function getFeedLifecycleTransitionTypes(): readonly FeedLifecycleTransitionType[] {
  return [
    'normal',
    'failure',
    'recovery',
    'maintenance',
    'administrative',
    'migration',
    'terminal',
  ];
}

export function getFeedLifecycleTransitionCategories(): readonly FeedLifecycleTransitionCategory[] {
  return [
    'lifecycle',
    'operational',
    'administrative',
    'recovery',
    'failure',
    'system',
    'user-initiated',
    'automated',
    'scheduled',
    'background',
  ];
}

export function getFeedLifecycleTransitionById(
  id: string,
): FeedLifecycleTransitionDefinition | undefined {
  return getFeedLifecycleTransitionDefinitions().find((transition) => transition.id === id);
}

export function getAllowedTransitions(
  state: FeedLifecycleState | string,
): readonly FeedLifecycleTransitionDefinition[] {
  const normalized = normalizeFeedStatus(state) as FeedLifecycleState;
  return getFeedLifecycleTransitionRegistry().get(normalized) ?? [];
}

export function getRecoveryTransitions(): readonly FeedLifecycleTransitionDefinition[] {
  return getFeedLifecycleTransitionDefinitions().filter(
    (transition) => transition.category === 'recovery' || transition.transitionType === 'recovery',
  );
}

export function getFeedLifecycleStateDefinitions(): readonly FeedLifecycleState[] {
  return Object.keys(FEED_LIFECYCLE_STATE_METADATA) as FeedLifecycleState[];
}

export function getFeedLifecycleStateMetadataByStatus(
  status: FeedStatus | string,
): FeedLifecycleStateMetadata | undefined {
  return getFeedStatusMetadata(status) ? getFeedLifecycleStateMetadata(status) : undefined;
}
