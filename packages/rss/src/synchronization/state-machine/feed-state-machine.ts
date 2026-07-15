import { createFeedStateTransitionError, createFeedStateValidationError } from '../errors';
import type { FeedSynchronizationState } from '../types';

export class FeedStateMachine {
  private static readonly allowedTransitions = new Map<string, readonly string[]>([
    ['NeverSynced', ['Pending', 'Preparing']],
    ['Pending', ['Preparing', 'Cancelled', 'Failed', 'Outdated', 'Unchanged']],
    ['Preparing', ['Running', 'Cancelled', 'Failed']],
    ['Running', ['Persisting', 'Paused', 'Failed', 'Cancelled', 'Outdated']],
    ['Persisting', ['Completed', 'Failed', 'Cancelled', 'Unchanged']],
    ['Completed', ['Unchanged', 'Outdated']],
    ['Failed', ['Pending', 'Preparing']],
    ['Cancelled', ['Pending']],
    ['Paused', ['Running', 'Pending']],
    ['Outdated', ['Pending', 'Preparing']],
    ['Unchanged', ['Pending', 'Outdated']],
  ]);

  public transition(fromState: string, toState: string): string {
    if (!this.canTransition(fromState, toState)) {
      throw createFeedStateTransitionError(`Invalid state transition from ${fromState} to ${toState}.`, { fromState, toState, state: fromState });
    }
    return toState;
  }

  public canTransition(fromState: string, toState: string): boolean {
    if (!FeedStateMachine.allowedTransitions.has(fromState)) {
      return false;
    }
    return FeedStateMachine.allowedTransitions.get(fromState)?.includes(toState) ?? false;
  }

  public validate(state: FeedSynchronizationState): boolean {
    if (!state.feedId) {
      throw createFeedStateValidationError('Feed identifier is required.', { feedId: state.feedId });
    }
    if (!FeedStateMachine.allowedTransitions.has(state.currentState)) {
      throw createFeedStateValidationError(`Unsupported state ${state.currentState}.`, { feedId: state.feedId, state: state.currentState });
    }
    return true;
  }
}
