import { normalizeFeedStatus } from '../status';
import type {
  TransitionGuardContext,
  TransitionGuardDefinition,
  TransitionGuardResult,
} from './contracts';
import { getFeedLifecycleTransitionById } from './registry';

function createGuardResult(
  context: TransitionGuardContext,
  guardId: string,
  allowed: boolean,
  reason: string,
  code: string,
  metadata: Record<string, unknown> = {},
): TransitionGuardResult {
  return {
    allowed,
    guardId,
    transition: `${normalizeFeedStatus(context.request.currentState)}->${normalizeFeedStatus(context.request.targetState)}`,
    reason,
    code,
    metadata,
    context,
  };
}

const GUARDS: readonly TransitionGuardDefinition[] = [
  {
    id: 'lifecycle.terminal-state',
    category: 'lifecycle',
    description: 'Prevents transitions from or to terminal states such as archived or deleted.',
    evaluate(context) {
      const { request } = context;
      const fromState = normalizeFeedStatus(request.currentState);
      const toState = normalizeFeedStatus(request.targetState);

      if (
        fromState === 'DELETED' ||
        toState === 'DELETED' ||
        fromState === 'ARCHIVED' ||
        toState === 'ARCHIVED'
      ) {
        return createGuardResult(
          context,
          this.id,
          false,
          'Terminal feed states cannot be transitioned through the lifecycle guard framework.',
          'terminal-state',
          { fromState, toState },
        );
      }

      return createGuardResult(
        context,
        this.id,
        true,
        'Terminal-state guard did not block the transition.',
        'ok',
        { fromState, toState },
      );
    },
  },
  {
    id: 'lifecycle.transition-definition',
    category: 'lifecycle',
    description: 'Requires that the transition be registered in the lifecycle registry.',
    evaluate(context) {
      const { request } = context;
      const fromState = normalizeFeedStatus(request.currentState);
      const toState = normalizeFeedStatus(request.targetState);
      const definition = getFeedLifecycleTransitionById(
        `${fromState.toLowerCase()}.${toState.toLowerCase()}`,
      );

      if (!definition) {
        return createGuardResult(
          context,
          this.id,
          false,
          'The requested transition is not registered in the lifecycle registry.',
          'unregistered-transition',
          { fromState, toState },
        );
      }

      return createGuardResult(
        context,
        this.id,
        true,
        'The transition is registered in the lifecycle registry.',
        'ok',
        { fromState, toState, transitionId: definition.id },
      );
    },
  },
];

export function getTransitionGuardDefinitions(): readonly TransitionGuardDefinition[] {
  return GUARDS;
}

export function evaluateTransitionGuards(
  request: TransitionGuardContext['request'],
): TransitionGuardResult {
  const context: TransitionGuardContext = { request };
  const guardResults = getTransitionGuardDefinitions().map((definition) =>
    definition.evaluate(context),
  );
  const firstRejection = guardResults.find((result) => !result.allowed);

  if (firstRejection) {
    return firstRejection;
  }

  return {
    allowed: true,
    guardId: 'lifecycle.guard-pipeline',
    transition: `${normalizeFeedStatus(request.currentState)}->${normalizeFeedStatus(request.targetState)}`,
    reason: 'Transition passed all centralized guard checks.',
    code: 'ok',
    metadata: { guardCount: guardResults.length },
    context,
  };
}
