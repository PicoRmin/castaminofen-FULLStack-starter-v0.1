import { isValidFeedStatus, normalizeFeedStatus } from '../status';
import { createTransitionCommand, TransitionCommand } from './commands';
import {
  FeedLifecycleViolationError,
  FeedValidationRequiredError,
  InvalidStateTransitionError,
} from './errors';
import { getFeedLifecycleStateMachine } from './registry';
import { TransitionExecutionCoordinator } from './coordinator';
import type {
  FeedLifecycleHooks,
  FeedLifecycleLogger,
  FeedLifecycleState,
  FeedLifecycleTransition,
  FeedLifecycleTransitionRequest,
  FeedLifecycleTransitionResult,
} from './types';

export class FeedLifecycleService {
  private readonly coordinator: TransitionExecutionCoordinator;

  constructor(
    private readonly logger?: FeedLifecycleLogger,
    private readonly hooks?: FeedLifecycleHooks,
  ) {
    this.coordinator = new TransitionExecutionCoordinator({
      lifecycleService: this,
      logger,
    });
  }

  transition(request: FeedLifecycleTransitionRequest): FeedLifecycleTransitionResult;
  transition(request: TransitionCommand): FeedLifecycleTransitionResult;
  transition(
    request: FeedLifecycleTransitionRequest | TransitionCommand,
  ): FeedLifecycleTransitionResult {
    const result = this.coordinator.execute(request);

    if (result.status !== 'success' || !result.executionResult) {
      const message = result.failure?.message ?? 'Transition execution failed.';
      this.logger?.warn?.('lifecycle.transition.rejected', {
        executionId: result.context.executionId,
        failureCode: result.failure?.code,
      });
      this.hooks?.onTransitionRejected?.({
        feedId: request instanceof TransitionCommand ? request.feed.id : request.feedId,
        previousState: 'UNKNOWN' as FeedLifecycleState,
        targetState: 'UNKNOWN' as FeedLifecycleState,
        reason: message,
        actor: request instanceof TransitionCommand ? request.actor.id : 'system',
        timestamp: Date.now(),
        metadata: {},
      });
      throw new InvalidStateTransitionError(message, {
        executionId: result.context.executionId,
        failureCode: result.failure?.code,
      });
    }

    return result.executionResult;
  }

  executeTransition(
    request: FeedLifecycleTransitionRequest | TransitionCommand,
  ): FeedLifecycleTransitionResult {
    const command =
      request instanceof TransitionCommand
        ? request
        : createTransitionCommand(request as FeedLifecycleTransitionRequest);
    const previousState = this.normalizeState(command.transition.currentState);
    const nextState = this.normalizeState(command.transition.targetState);
    const actor = command.actor.id;
    const reason =
      (command.executionContext.requestMetadata?.reason as string | undefined) ??
      'state-transition';
    const timestamp = command.timestamp;
    const metadata = { ...(command.metadata.custom ?? {}) };

    this.logger?.info?.('lifecycle.started', {
      feedId: command.feed.id,
      from: previousState,
      to: nextState,
      actor,
    });

    if (!this.isAllowedTransition(previousState, nextState)) {
      const message = `Invalid state transition from ${previousState} to ${nextState}`;
      this.logger?.warn?.('lifecycle.transition.rejected', {
        feedId: command.feed.id,
        from: previousState,
        to: nextState,
        actor,
        reason,
      });
      this.hooks?.onTransitionRejected?.({
        feedId: command.feed.id,
        previousState,
        targetState: nextState,
        reason: message,
        actor,
        timestamp,
        metadata,
      });
      throw new InvalidStateTransitionError(message, {
        feedId: command.feed.id,
        fromState: previousState,
        toState: nextState,
      });
    }

    const transition: FeedLifecycleTransition = {
      feedId: command.feed.id,
      previousState,
      nextState,
      actor,
      reason,
      timestamp,
      correlationId: command.correlationId,
      metadata,
    };

    this.hooks?.onTransitionStarted?.(transition);
    this.logger?.info?.('lifecycle.transition', {
      feedId: command.feed.id,
      from: previousState,
      to: nextState,
      actor,
      reason,
      pipelineExecutionId: command.executionId ?? command.id,
    });
    this.hooks?.onTransitionCompleted?.(transition);

    return {
      allowed: true,
      previousState,
      nextState,
      reason,
      actor,
      timestamp,
      correlationId: command.correlationId,
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

  private normalizeState(state: FeedLifecycleState | string): FeedLifecycleState {
    if (!isValidFeedStatus(state)) {
      throw new FeedLifecycleViolationError(`Unsupported lifecycle state ${state}`, { state });
    }
    return normalizeFeedStatus(state) as FeedLifecycleState;
  }
}
