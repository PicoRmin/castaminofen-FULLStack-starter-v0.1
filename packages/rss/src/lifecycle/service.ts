import { isValidFeedStatus, normalizeFeedStatus } from '../status';
import {
  FeedLifecycleViolationError,
  FeedValidationRequiredError,
  InvalidStateTransitionError,
} from './errors';
import { getFeedLifecycleStateMachine, getFeedLifecycleTransitionRegistry } from './registry';
import type {
  FeedLifecycleHooks,
  FeedLifecycleLogger,
  FeedLifecycleState,
  FeedLifecycleTransition,
  FeedLifecycleTransitionRequest,
  FeedLifecycleTransitionResult,
} from './types';

export class FeedLifecycleService {
  constructor(
    private readonly logger?: FeedLifecycleLogger,
    private readonly hooks?: FeedLifecycleHooks,
  ) {}

  transition(request: FeedLifecycleTransitionRequest): FeedLifecycleTransitionResult {
    const previousState = this.normalizeState(request.currentState);
    const nextState = this.normalizeState(request.targetState);
    const actor = request.actor ?? 'system';
    const reason = request.reason ?? 'state-transition';
    const timestamp = Date.now();
    const metadata = { ...(request.metadata ?? {}) };

    this.logger?.info?.('lifecycle.started', {
      feedId: request.feedId,
      from: previousState,
      to: nextState,
      actor,
    });

    if (!this.isAllowedTransition(previousState, nextState)) {
      const message = `Invalid state transition from ${previousState} to ${nextState}`;
      this.logger?.warn?.('lifecycle.transition.rejected', {
        feedId: request.feedId,
        from: previousState,
        to: nextState,
        actor,
        reason,
      });
      this.hooks?.onTransitionRejected?.({
        feedId: request.feedId,
        previousState,
        targetState: nextState,
        reason: message,
        actor,
        timestamp,
        metadata,
      });
      throw new InvalidStateTransitionError(message, {
        feedId: request.feedId,
        fromState: previousState,
        toState: nextState,
      });
    }

    this.validateBusinessRules(previousState, nextState, request.feedId);

    const transition: FeedLifecycleTransition = {
      feedId: request.feedId,
      previousState,
      nextState,
      actor,
      reason,
      timestamp,
      correlationId: request.correlationId,
      metadata,
    };

    this.hooks?.onTransitionStarted?.(transition);
    this.logger?.info?.('lifecycle.transition', {
      feedId: request.feedId,
      from: previousState,
      to: nextState,
      actor,
      reason,
    });
    this.hooks?.onTransitionCompleted?.(transition);

    return {
      allowed: true,
      previousState,
      nextState,
      reason,
      actor,
      timestamp,
      correlationId: request.correlationId,
      metadata,
    };
  }

  canImport(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized === 'READY' || normalized === 'ACTIVE' || normalized === 'REGISTERED';
  }

  canSynchronize(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized === 'ACTIVE' || normalized === 'READY';
  }

  canArchive(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized !== 'ARCHIVED' && normalized !== 'DELETED';
  }

  canDelete(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized !== 'DELETED';
  }

  canActivate(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized === 'READY' || normalized === 'DISABLED' || normalized === 'PAUSED';
  }

  canPause(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized === 'ACTIVE' || normalized === 'SYNCING';
  }

  canDisable(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return normalized !== 'DISABLED' && normalized !== 'DELETED' && normalized !== 'ARCHIVED';
  }

  canRecover(state: FeedLifecycleState | string): boolean {
    const normalized = this.normalizeState(state);
    return (
      normalized === 'VALIDATION_FAILED' ||
      normalized === 'IMPORT_FAILED' ||
      normalized === 'SYNC_FAILED' ||
      normalized === 'DISABLED'
    );
  }

  private isAllowedTransition(
    previousState: FeedLifecycleState,
    nextState: FeedLifecycleState,
  ): boolean {
    return getFeedLifecycleStateMachine().canTransition(previousState, nextState);
  }

  private validateBusinessRules(
    previousState: FeedLifecycleState,
    nextState: FeedLifecycleState,
    feedId: string,
  ): void {
    if (previousState === 'DELETED' || nextState === 'DELETED') {
      if (previousState === 'DELETED' && nextState !== 'DELETED') {
        throw new FeedLifecycleViolationError('Deleted feeds cannot transition.', {
          feedId,
          fromState: previousState,
          toState: nextState,
        });
      }
    }

    if (previousState === 'ARCHIVED' && nextState !== 'DELETED' && nextState !== 'ACTIVE') {
      throw new FeedLifecycleViolationError(
        'Archived feeds cannot transition except to active or deleted.',
        { feedId, fromState: previousState, toState: nextState },
      );
    }

    if (nextState === 'SYNCING' && !this.canSynchronize(previousState)) {
      throw new FeedLifecycleViolationError(
        'Feed cannot synchronize before successful validation and activation.',
        { feedId, fromState: previousState, toState: nextState },
      );
    }

    if (nextState === 'IMPORTING' && !this.canImport(previousState)) {
      throw new FeedLifecycleViolationError('Feed cannot import from the current state.', {
        feedId,
        fromState: previousState,
        toState: nextState,
      });
    }

    if (nextState === 'ACTIVE' && previousState === 'VALIDATION_FAILED') {
      throw new FeedValidationRequiredError(
        'A failed feed cannot become active without recovery.',
        { feedId, fromState: previousState, toState: nextState },
      );
    }

    if (nextState === 'ACTIVE' && previousState === 'IMPORT_FAILED') {
      throw new FeedValidationRequiredError(
        'A failed import feed cannot become active without recovery.',
        { feedId, fromState: previousState, toState: nextState },
      );
    }

    if (nextState === 'ACTIVE' && previousState === 'SYNC_FAILED') {
      throw new FeedValidationRequiredError(
        'A failed synchronization feed cannot become active without recovery.',
        { feedId, fromState: previousState, toState: nextState },
      );
    }

    if (['DISABLED', 'PAUSED', 'ARCHIVED', 'DELETED'].includes(previousState)) {
      if (nextState === 'SYNCING') {
        throw new FeedLifecycleViolationError('This feed is not eligible for synchronization.', {
          feedId,
          fromState: previousState,
          toState: nextState,
        });
      }
    }
  }

  private normalizeState(state: FeedLifecycleState | string): FeedLifecycleState {
    if (!isValidFeedStatus(state)) {
      throw new FeedLifecycleViolationError(`Unsupported lifecycle state ${state}`, { state });
    }
    return normalizeFeedStatus(state) as FeedLifecycleState;
  }
}
