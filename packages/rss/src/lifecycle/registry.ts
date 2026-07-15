import { getFeedStatusMetadata, normalizeFeedStatus } from '../status';
import type { FeedStatus } from '../status';
import type {
  FeedLifecycleState,
  FeedLifecycleStateMetadata,
  FeedLifecycleTransitionDefinition,
  FeedLifecycleTransitionRegistry,
  FeedLifecycleTransitionType,
  FeedLifecycleStateMachine,
} from './types';

const FEED_LIFECYCLE_TRANSITIONS: readonly FeedLifecycleTransitionDefinition[] = [
  {
    id: 'new.registered',
    from: 'NEW',
    to: 'REGISTERED',
    category: 'automatic',
    description: 'Initial registration of a newly created feed.',
    operationalIntent: 'registration',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'new.deleted',
    from: 'NEW',
    to: 'DELETED',
    category: 'administrative',
    description: 'Immediate deletion of a newly created feed.',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'registered.validating',
    from: 'REGISTERED',
    to: 'VALIDATING',
    category: 'automatic',
    description: 'Start feed validation.',
    operationalIntent: 'validation',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'registered.ready',
    from: 'REGISTERED',
    to: 'READY',
    category: 'automatic',
    description: 'Validation completed successfully.',
    operationalIntent: 'validation',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'registered.disabled',
    from: 'REGISTERED',
    to: 'DISABLED',
    category: 'administrative',
    description: 'Disable a feed during setup.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'validating.ready',
    from: 'VALIDATING',
    to: 'READY',
    category: 'automatic',
    description: 'Validation completed successfully.',
    operationalIntent: 'validation',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'validating.validation-failed',
    from: 'VALIDATING',
    to: 'VALIDATION_FAILED',
    category: 'failure',
    description: 'Validation failed.',
    operationalIntent: 'validation',
    transitionType: 'failure',
    visibility: 'internal',
  },
  {
    id: 'validation-failed.validating',
    from: 'VALIDATION_FAILED',
    to: 'VALIDATING',
    category: 'recovery',
    description: 'Retry validation after a failure.',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
  },
  {
    id: 'validation-failed.ready',
    from: 'VALIDATION_FAILED',
    to: 'READY',
    category: 'recovery',
    description: 'Recover to a ready state.',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
  },
  {
    id: 'ready.importing',
    from: 'READY',
    to: 'IMPORTING',
    category: 'automatic',
    description: 'Start importing feed content.',
    operationalIntent: 'import',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'ready.active',
    from: 'READY',
    to: 'ACTIVE',
    category: 'automatic',
    description: 'Activate a ready feed.',
    operationalIntent: 'activation',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'ready.disabled',
    from: 'READY',
    to: 'DISABLED',
    category: 'administrative',
    description: 'Disable a ready feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'importing.active',
    from: 'IMPORTING',
    to: 'ACTIVE',
    category: 'automatic',
    description: 'Import completed successfully.',
    operationalIntent: 'import',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'importing.import-failed',
    from: 'IMPORTING',
    to: 'IMPORT_FAILED',
    category: 'failure',
    description: 'Import failed.',
    operationalIntent: 'import',
    transitionType: 'failure',
    visibility: 'internal',
  },
  {
    id: 'active.syncing',
    from: 'ACTIVE',
    to: 'SYNCING',
    category: 'automatic',
    description: 'Begin synchronization.',
    operationalIntent: 'synchronization',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'active.paused',
    from: 'ACTIVE',
    to: 'PAUSED',
    category: 'administrative',
    description: 'Pause an active feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'active.disabled',
    from: 'ACTIVE',
    to: 'DISABLED',
    category: 'administrative',
    description: 'Disable an active feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'syncing.active',
    from: 'SYNCING',
    to: 'ACTIVE',
    category: 'automatic',
    description: 'Synchronization completed successfully.',
    operationalIntent: 'synchronization',
    transitionType: 'automatic',
    visibility: 'internal',
  },
  {
    id: 'syncing.sync-failed',
    from: 'SYNCING',
    to: 'SYNC_FAILED',
    category: 'failure',
    description: 'Synchronization failed.',
    operationalIntent: 'synchronization',
    transitionType: 'failure',
    visibility: 'internal',
  },
  {
    id: 'sync-failed.active',
    from: 'SYNC_FAILED',
    to: 'ACTIVE',
    category: 'recovery',
    description: 'Recover to active after a sync failure.',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
  },
  {
    id: 'sync-failed.ready',
    from: 'SYNC_FAILED',
    to: 'READY',
    category: 'recovery',
    description: 'Recover to ready after a sync failure.',
    operationalIntent: 'recovery',
    transitionType: 'recovery',
    visibility: 'internal',
  },
  {
    id: 'paused.active',
    from: 'PAUSED',
    to: 'ACTIVE',
    category: 'administrative',
    description: 'Resume a paused feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'disabled.active',
    from: 'DISABLED',
    to: 'ACTIVE',
    category: 'administrative',
    description: 'Re-enable a disabled feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'archived.active',
    from: 'ARCHIVED',
    to: 'ACTIVE',
    category: 'administrative',
    description: 'Restore an archived feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'archived.deleted',
    from: 'ARCHIVED',
    to: 'DELETED',
    category: 'administrative',
    description: 'Delete an archived feed.',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'active.archived',
    from: 'ACTIVE',
    to: 'ARCHIVED',
    category: 'administrative',
    description: 'Archive an active feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'active.ready',
    from: 'ACTIVE',
    to: 'READY',
    category: 'administrative',
    description: 'Move an active feed back to ready.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'ready.archived',
    from: 'READY',
    to: 'ARCHIVED',
    category: 'administrative',
    description: 'Archive a ready feed.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'ready.deleted',
    from: 'READY',
    to: 'DELETED',
    category: 'administrative',
    description: 'Delete a ready feed.',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'active.deleted',
    from: 'ACTIVE',
    to: 'DELETED',
    category: 'administrative',
    description: 'Delete an active feed.',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'paused.deleted',
    from: 'PAUSED',
    to: 'DELETED',
    category: 'administrative',
    description: 'Delete a paused feed.',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'disabled.deleted',
    from: 'DISABLED',
    to: 'DELETED',
    category: 'administrative',
    description: 'Delete a disabled feed.',
    operationalIntent: 'deletion',
    transitionType: 'administrative',
    visibility: 'internal',
  },
  {
    id: 'archived.ready',
    from: 'ARCHIVED',
    to: 'READY',
    category: 'administrative',
    description: 'Restore an archived feed to ready.',
    operationalIntent: 'administrative',
    transitionType: 'administrative',
    visibility: 'internal',
  },
];

function buildTransitionRegistry(): FeedLifecycleTransitionRegistry {
  const registry = new Map<FeedLifecycleState, readonly FeedLifecycleState[]>();
  for (const transition of FEED_LIFECYCLE_TRANSITIONS) {
    const nextStates = registry.get(transition.from) ?? [];
    registry.set(transition.from, [...nextStates, transition.to]);
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
      const allowedStates = getFeedLifecycleTransitionRegistry().get(from);
      return Boolean(allowedStates?.includes(to));
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
      return getFeedLifecycleTransitionRegistry().get(normalized) ?? [];
    },
  };
  return stateMachine;
}

export function getFeedLifecycleTransitionDefinitions(): readonly FeedLifecycleTransitionDefinition[] {
  return FEED_LIFECYCLE_TRANSITIONS;
}

export function getFeedLifecycleTransitionTypes(): readonly FeedLifecycleTransitionType[] {
  return ['automatic', 'administrative', 'failure', 'recovery'];
}

export function getFeedLifecycleStateDefinitions(): readonly FeedLifecycleState[] {
  return Object.keys(FEED_LIFECYCLE_STATE_METADATA) as FeedLifecycleState[];
}

export function getFeedLifecycleStateMetadataByStatus(
  status: FeedStatus | string,
): FeedLifecycleStateMetadata | undefined {
  return getFeedStatusMetadata(status) ? getFeedLifecycleStateMetadata(status) : undefined;
}
