import { isValidFeedStatus, normalizeFeedStatus } from '../status';
import { createTransitionCommand, TransitionCommand } from './commands';
import {
  FeedLifecycleViolationError,
  FeedValidationRequiredError,
  InvalidStateTransitionError,
} from './errors';
import { getFeedLifecycleStateMachine } from './registry';
import { createDefaultTransitionPipeline, type TransitionPipelineRequest } from './pipeline';
import type {
  FeedLifecycleHooks,
  FeedLifecycleLogger,
  FeedLifecycleState,
  FeedLifecycleTransition,
  FeedLifecycleTransitionRequest,
  FeedLifecycleTransitionResult,
} from './types';

export class FeedLifecycleService {
  private readonly pipeline = createDefaultTransitionPipeline();

  constructor(
    private readonly logger?: FeedLifecycleLogger,
    private readonly hooks?: FeedLifecycleHooks,
  ) {}

  transition(request: FeedLifecycleTransitionRequest): FeedLifecycleTransitionResult;
  transition(request: TransitionCommand): FeedLifecycleTransitionResult;
  transition(
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

    const pipelineRequest: TransitionPipelineRequest = {
      feedId: command.feed.id,
      currentState: command.transition.currentState,
      targetState: command.transition.targetState,
      actor: command.actor.id,
      correlationId: command.correlationId ?? 'unknown',
      metadata: (command.metadata.custom as Record<string, unknown> | undefined) ?? {},
      requestSource: 'feed-lifecycle-service',
      executionMode: 'sync',
    };

    const pipelineResult = this.pipeline.execute(pipelineRequest);
    const context = pipelineResult.context;

    if (pipelineResult.status !== 'success') {
      const message =
        pipelineResult.failure?.message ?? 'Transition processing pipeline rejected the request.';
      this.logger?.warn?.('lifecycle.transition.rejected', {
        feedId: command.feed.id,
        from: previousState,
        to: nextState,
        actor,
        reason,
        pipelineCode: pipelineResult.failure?.code,
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
        pipelineCode: pipelineResult.failure?.code,
      });
    }

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
      pipelineExecutionId: context.metadata.executionId,
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
