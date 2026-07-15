import { createHash } from 'node:crypto';

import type { TransitionGuardResult, TransitionValidationResult } from './contracts';
import type { FeedLifecycleTransitionDefinition, FeedLifecycleTransitionRequest } from './types';

export type TransitionDecisionType = 'ALLOW' | 'REJECT' | 'DEFER' | 'CANCEL';
export type TransitionDecisionCategory =
  'aggregation' | 'validation' | 'guard' | 'policy' | 'configuration' | 'operational';
export type TransitionDecisionSeverity =
  'info' | 'warning' | 'critical' | 'administrative' | 'emergency';
export type TransitionDecisionPriority =
  | 'standard'
  | 'blocking'
  | 'warning'
  | 'deferred'
  | 'administrative-override'
  | 'emergency-override'
  | 'maintenance-override';
export type TransitionDecisionFailureType =
  | 'DecisionConflict'
  | 'IncompleteEvaluation'
  | 'MissingValidationResult'
  | 'MissingGuardResult'
  | 'MissingPolicyResult'
  | 'DecisionAggregationFailure'
  | 'UnexpectedDecisionState'
  | 'DecisionConfigurationFailure';

export interface TransitionDecisionSummary {
  readonly present: boolean;
  readonly status: 'passed' | 'failed' | 'deferred' | 'skipped' | 'unknown';
  readonly code: string | undefined;
  readonly reason: string | undefined;
}

export interface TransitionDecisionFailure {
  readonly type: TransitionDecisionFailureType;
  readonly message: string;
  readonly code: string;
  readonly details: Record<string, unknown>;
}

export interface TransitionDecisionResult {
  readonly decisionId: string;
  readonly decisionType: TransitionDecisionType;
  readonly decisionReason: string;
  readonly decisionCategory: TransitionDecisionCategory;
  readonly decisionSeverity: TransitionDecisionSeverity;
  readonly decisionPriority: TransitionDecisionPriority;
  readonly decisionConfidence: number;
  readonly evaluationTimestamp: string;
  readonly executionIdentifier: string;
  readonly correlationIdentifier: string;
  readonly transitionIdentifier: string;
  readonly sourceState: string;
  readonly targetState: string;
  readonly validationSummary: TransitionDecisionSummary;
  readonly guardSummary: TransitionDecisionSummary;
  readonly policySummary: TransitionDecisionSummary;
  readonly metadata: Record<string, unknown>;
  readonly futureRetryMetadata: Record<string, unknown>;
  readonly futureRecoveryMetadata: Record<string, unknown>;
  readonly futureNotificationMetadata: Record<string, unknown>;
  readonly futureAuditMetadata: Record<string, unknown>;
  readonly futureMetricsMetadata: Record<string, unknown>;
  readonly futureLoggingMetadata: Record<string, unknown>;
  readonly failure: TransitionDecisionFailure | undefined;
}

export interface TransitionDecisionContext {
  readonly request: FeedLifecycleTransitionRequest;
  readonly transitionDefinition?: FeedLifecycleTransitionDefinition;
  readonly executionIdentifier?: string;
  readonly correlationIdentifier?: string;
  readonly transitionIdentifier?: string;
  readonly sourceState?: string;
  readonly targetState?: string;
  readonly requestSource?: string;
  readonly actor?: string;
  readonly executionContext?: Record<string, unknown>;
  readonly pipelineContext?: Record<string, unknown>;
  readonly validationResult?: TransitionValidationResult;
  readonly guardResult?: TransitionGuardResult;
  readonly policyResult?: {
    readonly allowed: boolean;
    readonly status: 'allowed' | 'rejected' | 'deferred' | 'warning' | 'pending';
    readonly identifier?: string;
    readonly reason?: string;
    readonly code?: string;
    readonly metadata?: Record<string, unknown>;
  };
  readonly repositorySnapshot?: Record<string, unknown>;
  readonly configuration?: Record<string, unknown>;
  readonly environment?: Record<string, unknown>;
  readonly featureFlags?: Record<string, boolean>;
  readonly metadata?: Record<string, unknown>;
  readonly evaluationTimestamp?: string;
}

export interface TransitionDecisionEngine {
  readonly evaluate: (context: TransitionDecisionContext) => TransitionDecisionResult;
}

export function createTransitionDecisionEngine(): TransitionDecisionEngine {
  return {
    evaluate(context) {
      const sourceState = String(context.sourceState ?? context.request.currentState ?? 'unknown');
      const targetState = String(context.targetState ?? context.request.targetState ?? 'unknown');
      const transitionIdentifier =
        context.transitionIdentifier ??
        context.transitionDefinition?.id ??
        `${sourceState}.${targetState}`;
      const executionIdentifier =
        context.executionIdentifier ??
        String(
          (context.executionContext?.executionId as string | undefined) ??
            (context.pipelineContext?.executionId as string | undefined) ??
            'transition-execution',
        );
      const correlationIdentifier =
        context.correlationIdentifier ??
        String(
          (context.pipelineContext?.correlationId as string | undefined) ??
            context.request.correlationId ??
            'uncorrelated',
        );
      const evaluationTimestamp = context.evaluationTimestamp ?? new Date().toISOString();

      const validationSummary = summarizeValidation(context.validationResult);
      const guardSummary = summarizeGuard(context.guardResult);
      const policySummary = summarizePolicy(context.policyResult);

      if (!context.validationResult) {
        return createDecisionResult({
          context,
          decisionType: 'CANCEL',
          decisionReason:
            'Validation results were not provided to the centralized decision engine.',
          decisionCategory: 'configuration',
          decisionSeverity: 'critical',
          decisionPriority: 'blocking',
          decisionConfidence: 0.7,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
          failure: createFailure(
            'MissingValidationResult',
            'Validation results were not provided to the centralized decision engine.',
            'missing-validation-result',
            {
              sourceState,
              targetState,
              transitionIdentifier,
            },
          ),
        });
      }

      if (!context.guardResult) {
        return createDecisionResult({
          context,
          decisionType: 'CANCEL',
          decisionReason: 'Guard results were not provided to the centralized decision engine.',
          decisionCategory: 'configuration',
          decisionSeverity: 'critical',
          decisionPriority: 'blocking',
          decisionConfidence: 0.7,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
          failure: createFailure(
            'MissingGuardResult',
            'Guard results were not provided to the centralized decision engine.',
            'missing-guard-result',
            {
              sourceState,
              targetState,
              transitionIdentifier,
            },
          ),
        });
      }

      if (!context.policyResult) {
        return createDecisionResult({
          context,
          decisionType: 'CANCEL',
          decisionReason: 'Policy results were not provided to the centralized decision engine.',
          decisionCategory: 'configuration',
          decisionSeverity: 'critical',
          decisionPriority: 'blocking',
          decisionConfidence: 0.7,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
          failure: createFailure(
            'MissingPolicyResult',
            'Policy results were not provided to the centralized decision engine.',
            'missing-policy-result',
            {
              sourceState,
              targetState,
              transitionIdentifier,
            },
          ),
        });
      }

      if (!context.validationResult.success) {
        return createDecisionResult({
          context,
          decisionType: 'REJECT',
          decisionReason: context.validationResult.reason,
          decisionCategory: 'validation',
          decisionSeverity: 'critical',
          decisionPriority: 'blocking',
          decisionConfidence: 0.95,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
          failure: createFailure(
            'DecisionConflict',
            'Validation results blocked the lifecycle transition.',
            context.validationResult.code,
            {
              validationCode: context.validationResult.code,
              validationReason: context.validationResult.reason,
              sourceState,
              targetState,
              transitionIdentifier,
            },
          ),
        });
      }

      if (!context.guardResult.allowed) {
        return createDecisionResult({
          context,
          decisionType: 'REJECT',
          decisionReason: context.guardResult.reason,
          decisionCategory: 'guard',
          decisionSeverity: 'critical',
          decisionPriority: 'blocking',
          decisionConfidence: 0.95,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
          failure: createFailure(
            'DecisionConflict',
            'Guard results blocked the lifecycle transition.',
            context.guardResult.code,
            {
              guardCode: context.guardResult.code,
              guardReason: context.guardResult.reason,
              sourceState,
              targetState,
              transitionIdentifier,
            },
          ),
        });
      }

      if (context.policyResult.status === 'deferred') {
        return createDecisionResult({
          context,
          decisionType: 'DEFER',
          decisionReason:
            context.policyResult.reason ?? 'Policy evaluation deferred the transition.',
          decisionCategory: 'policy',
          decisionSeverity: 'warning',
          decisionPriority: 'deferred',
          decisionConfidence: 0.82,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
        });
      }

      if (!context.policyResult.allowed || context.policyResult.status === 'rejected') {
        return createDecisionResult({
          context,
          decisionType: 'REJECT',
          decisionReason:
            context.policyResult.reason ?? 'Policy evaluation rejected the transition.',
          decisionCategory: 'policy',
          decisionSeverity: 'critical',
          decisionPriority: 'blocking',
          decisionConfidence: 0.93,
          evaluationTimestamp,
          executionIdentifier,
          correlationIdentifier,
          transitionIdentifier,
          sourceState,
          targetState,
          validationSummary,
          guardSummary,
          policySummary,
          failure: createFailure(
            'DecisionConflict',
            'Policy results rejected the lifecycle transition.',
            context.policyResult.code ?? 'policy-rejected',
            {
              policyCode: context.policyResult.code ?? 'policy-rejected',
              policyReason:
                context.policyResult.reason ?? 'Policy evaluation rejected the transition.',
              sourceState,
              targetState,
              transitionIdentifier,
            },
          ),
        });
      }

      return createDecisionResult({
        context,
        decisionType: 'ALLOW',
        decisionReason: 'Validation, guard, and policy stages all accepted the transition.',
        decisionCategory: 'aggregation',
        decisionSeverity: 'info',
        decisionPriority: 'standard',
        decisionConfidence: 0.96,
        evaluationTimestamp,
        executionIdentifier,
        correlationIdentifier,
        transitionIdentifier,
        sourceState,
        targetState,
        validationSummary,
        guardSummary,
        policySummary,
      });
    },
  };
}

export function evaluateTransitionDecision(
  context: TransitionDecisionContext,
): TransitionDecisionResult {
  return createTransitionDecisionEngine().evaluate(context);
}

function summarizeValidation(
  result: TransitionValidationResult | undefined,
): TransitionDecisionSummary {
  if (!result) {
    return {
      present: false,
      status: 'skipped',
      code: undefined,
      reason: undefined,
    };
  }

  return {
    present: true,
    status: result.success ? 'passed' : 'failed',
    code: result.code,
    reason: result.reason,
  };
}

function summarizeGuard(result: TransitionGuardResult | undefined): TransitionDecisionSummary {
  if (!result) {
    return {
      present: false,
      status: 'skipped',
      code: undefined,
      reason: undefined,
    };
  }

  return {
    present: true,
    status: result.allowed ? 'passed' : 'failed',
    code: result.code,
    reason: result.reason,
  };
}

function summarizePolicy(
  result: TransitionDecisionContext['policyResult'] | undefined,
): TransitionDecisionSummary {
  if (!result) {
    return {
      present: false,
      status: 'skipped',
      code: undefined,
      reason: undefined,
    };
  }

  const status = result.status === 'deferred' ? 'deferred' : result.allowed ? 'passed' : 'failed';

  return {
    present: true,
    status,
    code: result.code,
    reason: result.reason,
  };
}

function createDecisionResult(input: {
  context: TransitionDecisionContext;
  decisionType: TransitionDecisionType;
  decisionReason: string;
  decisionCategory: TransitionDecisionCategory;
  decisionSeverity: TransitionDecisionSeverity;
  decisionPriority: TransitionDecisionPriority;
  decisionConfidence: number;
  evaluationTimestamp: string;
  executionIdentifier: string;
  correlationIdentifier: string;
  transitionIdentifier: string;
  sourceState: string;
  targetState: string;
  validationSummary: TransitionDecisionSummary;
  guardSummary: TransitionDecisionSummary;
  policySummary: TransitionDecisionSummary;
  failure?: TransitionDecisionFailure;
}): TransitionDecisionResult {
  const metadata = {
    requestSource: input.context.requestSource,
    actor: input.context.actor ?? input.context.request.actor,
    transitionDefinitionId: input.context.transitionDefinition?.id,
    requestCorrelationId: input.context.request.correlationId,
    repositorySnapshot: input.context.repositorySnapshot,
    configuration: input.context.configuration,
    environment: input.context.environment,
    featureFlags: input.context.featureFlags,
    pipelineContext: input.context.pipelineContext,
    executionContext: input.context.executionContext,
    customMetadata: input.context.metadata ?? {},
  };

  return {
    decisionId: createDecisionIdentifier({
      executionIdentifier: input.executionIdentifier,
      correlationIdentifier: input.correlationIdentifier,
      transitionIdentifier: input.transitionIdentifier,
      sourceState: input.sourceState,
      targetState: input.targetState,
      decisionType: input.decisionType,
      evaluationTimestamp: input.evaluationTimestamp,
    }),
    decisionType: input.decisionType,
    decisionReason: input.decisionReason,
    decisionCategory: input.decisionCategory,
    decisionSeverity: input.decisionSeverity,
    decisionPriority: input.decisionPriority,
    decisionConfidence: input.decisionConfidence,
    evaluationTimestamp: input.evaluationTimestamp,
    executionIdentifier: input.executionIdentifier,
    correlationIdentifier: input.correlationIdentifier,
    transitionIdentifier: input.transitionIdentifier,
    sourceState: input.sourceState,
    targetState: input.targetState,
    validationSummary: input.validationSummary,
    guardSummary: input.guardSummary,
    policySummary: input.policySummary,
    metadata,
    futureRetryMetadata: {
      enabled: false,
      reason: 'Future retry engine integration pending.',
    },
    futureRecoveryMetadata: {
      enabled: false,
      reason: 'Future recovery engine integration pending.',
    },
    futureNotificationMetadata: {
      enabled: false,
      reason: 'Future notification integration pending.',
    },
    futureAuditMetadata: {
      enabled: false,
      reason: 'Future audit integration pending.',
    },
    futureMetricsMetadata: {
      enabled: false,
      reason: 'Future metrics integration pending.',
    },
    futureLoggingMetadata: {
      enabled: false,
      reason: 'Future logging integration pending.',
    },
    failure: input.failure,
  };
}

function createFailure(
  type: TransitionDecisionFailureType,
  message: string,
  code: string,
  details: Record<string, unknown>,
): TransitionDecisionFailure {
  return {
    type,
    message,
    code,
    details,
  };
}

function createDecisionIdentifier(input: {
  executionIdentifier: string;
  correlationIdentifier: string;
  transitionIdentifier: string;
  sourceState: string;
  targetState: string;
  decisionType: TransitionDecisionType;
  evaluationTimestamp: string;
}): string {
  const payload = [
    input.executionIdentifier,
    input.correlationIdentifier,
    input.transitionIdentifier,
    input.sourceState,
    input.targetState,
    input.decisionType,
    input.evaluationTimestamp,
  ].join('|');

  return createHash('sha256').update(payload).digest('hex').slice(0, 24);
}
