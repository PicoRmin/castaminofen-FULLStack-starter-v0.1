import { normalizeFeedStatus } from '../status';
import type {
  LifecyclePolicyCategory,
  LifecyclePolicyContext,
  LifecyclePolicyDefinition,
  LifecyclePolicyEvaluationResult,
  LifecyclePolicyResult,
  TransitionGuardResult,
  TransitionValidationResult,
} from './contracts';
import { getFeedLifecycleStateMetadata } from './registry';
import type { FeedLifecycleStateMetadata, FeedLifecycleTransitionDefinition } from './types';

export interface LifecyclePolicyEvaluationInput {
  readonly request: LifecyclePolicyContext['request'];
  readonly transitionDefinition: FeedLifecycleTransitionDefinition | undefined;
  readonly fromMetadata: FeedLifecycleStateMetadata | undefined;
  readonly toMetadata: FeedLifecycleStateMetadata | undefined;
  readonly guardResult: TransitionGuardResult | undefined;
  readonly validationResult: TransitionValidationResult | undefined;
  readonly configuration: Record<string, unknown> | undefined;
  readonly environment: Record<string, unknown> | undefined;
  readonly featureFlags: Record<string, boolean> | undefined;
  readonly repositorySnapshot: Record<string, unknown> | undefined;
  readonly metadata: Record<string, unknown> | undefined;
}

export interface LifecyclePolicyEngine {
  readonly evaluate: (input: LifecyclePolicyEvaluationInput) => LifecyclePolicyEvaluationResult;
}

function createPolicyResult(
  definition: LifecyclePolicyDefinition,
  status: LifecyclePolicyResult['status'],
  allowed: boolean,
  reason: string,
  code: string,
  metadata: Record<string, unknown> = {},
): LifecyclePolicyResult {
  return {
    allowed,
    status,
    policyId: definition.id,
    displayName: definition.displayName,
    description: definition.description,
    category: definition.category,
    priority: definition.priority,
    executionOrder: definition.executionOrder,
    reason,
    code,
    metadata,
    failureReason: allowed ? undefined : reason,
    retryHint: (definition.metadata?.retryHint as string | undefined) ?? undefined,
    notificationHint: (definition.metadata?.notificationHint as string | undefined) ?? undefined,
    auditMetadata:
      (definition.metadata?.auditMetadata as Record<string, unknown> | undefined) ?? undefined,
    loggingMetadata:
      (definition.metadata?.loggingMetadata as Record<string, unknown> | undefined) ?? undefined,
  };
}

const DEFAULT_POLICIES: readonly LifecyclePolicyDefinition[] = [
  {
    id: 'lifecycle.policy.recovery-gating',
    displayName: 'Recovery Gating',
    description:
      'Prevents failed feeds from transitioning to active state without recovery-oriented handling.',
    category: 'recovery',
    priority: 100,
    executionOrder: 1,
    metadata: {
      retryHint: 'recovery-required',
      notificationHint: 'recovery-required',
    },
    evaluate(context) {
      const fromState = normalizeFeedStatus(context.request.currentState);
      const toState = normalizeFeedStatus(context.request.targetState);

      if (
        toState === 'ACTIVE' &&
        ['VALIDATION_FAILED', 'IMPORT_FAILED', 'SYNC_FAILED'].includes(fromState)
      ) {
        return createPolicyResult(
          this,
          'rejected',
          false,
          'Failed feeds cannot become active without recovery.',
          'recovery-gating',
          { fromState, toState },
        );
      }

      return createPolicyResult(
        this,
        'allowed',
        true,
        'The recovery gating policy did not block the transition.',
        'ok',
        { fromState, toState },
      );
    },
  },
  {
    id: 'lifecycle.policy.synchronization-eligibility',
    displayName: 'Synchronization Eligibility',
    description:
      'Ensures synchronization transitions only occur from states that are eligible for synchronization.',
    category: 'synchronization',
    priority: 90,
    executionOrder: 2,
    metadata: {
      retryHint: 'state-not-eligible',
      notificationHint: 'synchronization-blocked',
    },
    evaluate(context) {
      const fromState = normalizeFeedStatus(context.request.currentState);
      const toState = normalizeFeedStatus(context.request.targetState);

      if (toState === 'SYNCING' && !['ACTIVE', 'READY'].includes(fromState)) {
        return createPolicyResult(
          this,
          'rejected',
          false,
          'Feed is not eligible for synchronization from the current state.',
          'synchronization-eligibility',
          { fromState, toState },
        );
      }

      return createPolicyResult(
        this,
        'allowed',
        true,
        'The synchronization eligibility policy did not block the transition.',
        'ok',
        { fromState, toState },
      );
    },
  },
  {
    id: 'lifecycle.policy.state-restrictions',
    displayName: 'State Restrictions',
    description: 'Applies lifecycle business restrictions for archived and deleted feeds.',
    category: 'administrative',
    priority: 80,
    executionOrder: 3,
    evaluate(context) {
      const fromState = normalizeFeedStatus(context.request.currentState);
      const toState = normalizeFeedStatus(context.request.targetState);

      if (fromState === 'DELETED' && toState !== 'DELETED') {
        return createPolicyResult(
          this,
          'rejected',
          false,
          'Deleted feeds cannot transition to another lifecycle state.',
          'deleted-state',
          { fromState, toState },
        );
      }

      if (fromState === 'ARCHIVED' && !['ACTIVE', 'DELETED'].includes(toState)) {
        return createPolicyResult(
          this,
          'rejected',
          false,
          'Archived feeds can only transition to active or deleted states.',
          'archived-state',
          { fromState, toState },
        );
      }

      return createPolicyResult(
        this,
        'allowed',
        true,
        'The state restriction policy did not block the transition.',
        'ok',
        { fromState, toState },
      );
    },
  },
  {
    id: 'lifecycle.policy.operational-readiness',
    displayName: 'Operational Readiness',
    description:
      'Uses the lifecycle metadata to ensure the target state is consistent with the feed status model.',
    category: 'operational',
    priority: 70,
    executionOrder: 4,
    evaluate(context) {
      const fromState = normalizeFeedStatus(context.request.currentState);
      const toState = normalizeFeedStatus(context.request.targetState);
      const fromMetadata = getFeedLifecycleStateMetadata(fromState);
      const toMetadata = getFeedLifecycleStateMetadata(toState);
      const metadata = {
        fromState,
        toState,
        fromClassification: fromMetadata?.classification,
        toClassification: toMetadata?.classification,
      };

      if (!fromMetadata || !toMetadata) {
        return createPolicyResult(
          this,
          'rejected',
          false,
          'The requested lifecycle states are not defined in the lifecycle metadata registry.',
          'unknown-state',
          metadata,
        );
      }

      return createPolicyResult(
        this,
        'allowed',
        true,
        'The operational readiness policy accepted the requested transition.',
        'ok',
        metadata,
      );
    },
  },
];

export function createLifecyclePolicyRegistry(): readonly LifecyclePolicyDefinition[] {
  return [...DEFAULT_POLICIES];
}

export function createLifecyclePolicyEngine(
  policies: readonly LifecyclePolicyDefinition[] = createLifecyclePolicyRegistry(),
): LifecyclePolicyEngine {
  const normalizedPolicies = [...policies].sort(
    (left, right) => left.priority - right.priority || left.executionOrder - right.executionOrder,
  );

  return {
    evaluate(input) {
      const policyResults: LifecyclePolicyResult[] = [];
      const context: LifecyclePolicyContext = {
        request: input.request,
        transitionDefinition: input.transitionDefinition,
        fromMetadata: input.fromMetadata,
        toMetadata: input.toMetadata,
        guardResult: input.guardResult,
        validationResult: input.validationResult,
        configuration: input.configuration,
        environment: input.environment,
        featureFlags: input.featureFlags,
        repositorySnapshot: input.repositorySnapshot,
        metadata: input.metadata,
      };

      for (const policy of normalizedPolicies) {
        const result = policy.evaluate(context);
        policyResults.push(result);

        if (!result.allowed) {
          return {
            allowed: false,
            status: result.status === 'deferred' ? 'deferred' : 'rejected',
            reason: result.reason,
            code: result.code,
            metadata: {
              policyId: result.policyId,
              category: result.category,
              priority: result.priority,
              executionOrder: result.executionOrder,
              evaluatedPolicyCount: policyResults.length,
            },
            policyResults,
          };
        }
      }

      const warnings = policyResults.filter((result) => result.status === 'warning');
      const deferred = policyResults.filter((result) => result.status === 'deferred');
      const status = warnings.length > 0 ? 'warning' : deferred.length > 0 ? 'deferred' : 'allowed';

      return {
        allowed: status === 'allowed' || status === 'warning',
        status,
        reason: 'Transition passed the lifecycle policy evaluation.',
        code: 'ok',
        metadata: {
          policyCount: policyResults.length,
          warningCount: warnings.length,
          deferredCount: deferred.length,
        },
        policyResults,
      };
    },
  };
}

export function evaluateLifecyclePolicies(
  input: LifecyclePolicyEvaluationInput,
  policies: readonly LifecyclePolicyDefinition[] = createLifecyclePolicyRegistry(),
): LifecyclePolicyEvaluationResult {
  return createLifecyclePolicyEngine(policies).evaluate(input);
}
