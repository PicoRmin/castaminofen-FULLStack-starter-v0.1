import { normalizeFeedStatus } from '../status';
import type {
  TransitionValidationContext,
  TransitionValidationDefinition,
  TransitionValidationResult,
} from './contracts';
import { getFeedLifecycleStateMetadata, getFeedLifecycleTransitionById } from './registry';

function createValidationResult(
  context: TransitionValidationContext,
  identifier: string,
  category: TransitionValidationDefinition['category'],
  success: boolean,
  reason: string,
  code: string,
  metadata: Record<string, unknown> = {},
): TransitionValidationResult {
  return {
    success,
    identifier,
    category,
    reason,
    code,
    metadata,
    context,
  };
}

const VALIDATIONS: readonly TransitionValidationDefinition[] = [
  {
    id: 'lifecycle.transition.validation',
    category: 'lifecycle',
    description: 'Validates that the transition is structurally and semantically allowed.',
    validate(context) {
      const { request } = context;
      const fromState = normalizeFeedStatus(request.currentState);
      const toState = normalizeFeedStatus(request.targetState);

      if (!request.feedId || !request.feedId.trim()) {
        return createValidationResult(
          context,
          this.id,
          this.category,
          false,
          'Feed identifier is required.',
          'missing-feed-id',
          { fromState, toState },
        );
      }

      if (fromState === toState) {
        return createValidationResult(
          context,
          this.id,
          this.category,
          false,
          'Transition target must differ from the current state.',
          'same-state-transition',
          { fromState, toState },
        );
      }

      const transition = getFeedLifecycleTransitionById(
        `${fromState.toLowerCase()}.${toState.toLowerCase()}`,
      );
      const fromMetadata = getFeedLifecycleStateMetadata(fromState);
      const toMetadata = getFeedLifecycleStateMetadata(toState);

      if (!transition) {
        return createValidationResult(
          context,
          this.id,
          this.category,
          false,
          `No lifecycle transition is registered for ${fromState} -> ${toState}.`,
          'unknown-transition',
          { fromState, toState },
        );
      }

      return createValidationResult(
        {
          ...context,
          ...(transition ? { transitionDefinition: transition } : {}),
          ...(fromMetadata ? { fromMetadata } : {}),
          ...(toMetadata ? { toMetadata } : {}),
        },
        this.id,
        this.category,
        true,
        'Transition is structurally and lifecycle-valid.',
        'ok',
        { fromState, toState, transitionId: transition.id },
      );
    },
  },
  {
    id: 'lifecycle.state.metadata',
    category: 'metadata',
    description: 'Ensures the current and target states have metadata available.',
    validate(context) {
      const { request } = context;
      const fromState = normalizeFeedStatus(request.currentState);
      const toState = normalizeFeedStatus(request.targetState);
      const fromMetadata = getFeedLifecycleStateMetadata(fromState);
      const toMetadata = getFeedLifecycleStateMetadata(toState);

      if (!fromMetadata || !toMetadata) {
        return createValidationResult(
          context,
          this.id,
          this.category,
          false,
          'Lifecycle metadata is missing for one or more states.',
          'missing-metadata',
          { fromState, toState },
        );
      }

      return createValidationResult(
        {
          ...context,
          ...(fromMetadata ? { fromMetadata } : {}),
          ...(toMetadata ? { toMetadata } : {}),
        },
        this.id,
        this.category,
        true,
        'Lifecycle metadata is available for the transition.',
        'ok',
        { fromState, toState },
      );
    },
  },
];

export function getTransitionValidationDefinitions(): readonly TransitionValidationDefinition[] {
  return VALIDATIONS;
}

export function validateTransitionRequest(
  request: TransitionValidationContext['request'],
): TransitionValidationResult {
  const context: TransitionValidationContext = { request };
  const validationResults = getTransitionValidationDefinitions().map((definition) =>
    definition.validate(context),
  );

  const firstFailure = validationResults.find((result) => !result.success);
  if (firstFailure) {
    return firstFailure;
  }

  return {
    success: true,
    identifier: 'lifecycle.transition.validation',
    category: 'lifecycle',
    reason: 'Transition passed all centralized validation checks.',
    code: 'ok',
    metadata: { validationCount: validationResults.length },
    context,
  };
}
