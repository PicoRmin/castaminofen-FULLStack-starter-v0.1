import { randomUUID } from 'node:crypto';

import { normalizeFeedStatus } from '../status';
import { evaluateTransitionGuards } from './guard-registry';
import { getFeedLifecycleTransitionById } from './registry';
import { createLifecyclePolicyEngine, type LifecyclePolicyEvaluationInput } from './policy-engine';
import type {
  FeedLifecycleState,
  FeedLifecycleTransitionDefinition,
  FeedLifecycleTransitionRequest,
} from './types';
import { validateTransitionRequest } from './validation-registry';

export type TransitionPipelineStatus =
  'pending' | 'running' | 'success' | 'failure' | 'cancelled' | 'rejected';

export interface TransitionPipelineRequest extends FeedLifecycleTransitionRequest {
  readonly requestSource?: string;
  readonly executionMode?: 'sync' | 'async' | 'background';
}

export interface TransitionPipelineExecutionMetadata {
  readonly executionId: string;
  readonly correlationId: string | undefined;
  readonly startedAt: number;
  readonly completedAt: number | undefined;
  readonly requestSource: string | undefined;
  readonly executionMode: 'sync' | 'async' | 'background' | undefined;
  readonly stageResults: Readonly<Record<string, unknown>>;
  readonly retryMetadata: Record<string, unknown>;
  readonly monitoringMetadata: Record<string, unknown>;
  readonly metricsMetadata: Record<string, unknown>;
  readonly eventMetadata: Record<string, unknown>;
}

export interface TransitionPipelineContext {
  readonly request: TransitionPipelineRequest;
  readonly currentState: FeedLifecycleState;
  readonly targetState: FeedLifecycleState;
  readonly status: TransitionPipelineStatus;
  readonly resolvedTransition: FeedLifecycleTransitionDefinition | undefined;
  readonly validationResult: ReturnType<typeof validateTransitionRequest> | undefined;
  readonly guardResult: ReturnType<typeof evaluateTransitionGuards> | undefined;
  readonly policyResult: TransitionPolicyResult | undefined;
  readonly executionResult: TransitionExecutionResult | undefined;
  readonly persistenceResult: TransitionPersistenceResult | undefined;
  readonly loggingMetadata: Record<string, unknown>;
  readonly metadata: TransitionPipelineExecutionMetadata;
  readonly failure: TransitionPipelineFailure | undefined;
}

export interface TransitionPipelineStage {
  readonly id: string;
  readonly purpose: string;
  readonly description: string;
  readonly run: (context: TransitionPipelineContext) => TransitionPipelineContext;
  readonly enabled?: (context: TransitionPipelineContext) => boolean;
}

export interface TransitionPipelineResult {
  readonly status: TransitionPipelineStatus;
  readonly context: TransitionPipelineContext;
  readonly failure: TransitionPipelineFailure | undefined;
  readonly validationReport: ReturnType<typeof validateTransitionRequest> | undefined;
  readonly guardReport: ReturnType<typeof evaluateTransitionGuards> | undefined;
  readonly policyReport: TransitionPolicyResult | undefined;
  readonly executionMetadata: TransitionPipelineExecutionMetadata;
  readonly pipelineMetadata: Record<string, unknown>;
}

export interface TransitionPolicyResult {
  readonly status: 'allowed' | 'rejected' | 'deferred' | 'warning' | 'pending';
  readonly identifier: string;
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
}

export interface TransitionExecutionResult {
  readonly status: 'planned' | 'completed';
  readonly identifier: string;
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
}

export interface TransitionPersistenceResult {
  readonly status: 'planned' | 'skipped';
  readonly identifier: string;
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
}

export class TransitionPipelineFailure extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly stageId: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'TransitionPipelineFailure';
  }
}

export class RegistryFailure extends TransitionPipelineFailure {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'registry-failure', 'registry-resolution', details);
    this.name = 'RegistryFailure';
  }
}

export class ValidationFailure extends TransitionPipelineFailure {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'validation-failure', 'validation', details);
    this.name = 'ValidationFailure';
  }
}

export class GuardFailure extends TransitionPipelineFailure {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'guard-failure', 'guard', details);
    this.name = 'GuardFailure';
  }
}

export class PipelineConfigurationFailure extends TransitionPipelineFailure {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'pipeline-configuration-failure', 'pipeline', details);
    this.name = 'PipelineConfigurationFailure';
  }
}

export class PipelineExecutionFailure extends TransitionPipelineFailure {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'pipeline-execution-failure', 'pipeline', details);
    this.name = 'PipelineExecutionFailure';
  }
}

export class UnexpectedStageFailure extends TransitionPipelineFailure {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'unexpected-stage-failure', 'pipeline', details);
    this.name = 'UnexpectedStageFailure';
  }
}

export class TransitionProcessingPipeline {
  private stages: TransitionPipelineStage[];

  constructor(stages: readonly TransitionPipelineStage[] = []) {
    this.stages = [...(stages.length > 0 ? stages : createDefaultStages())];
  }

  public execute(request: TransitionPipelineRequest): TransitionPipelineResult {
    const initialContext = this.createContext(request);
    let context = initialContext;

    for (const stage of this.stages) {
      if (stage.enabled && !stage.enabled(context)) {
        continue;
      }

      try {
        context = stage.run(context);
      } catch (error) {
        const failure = this.toFailure(error, stage.id);
        context = this.withFailure(context, failure);
        return this.buildResult(context);
      }

      if (this.shouldStop(context)) {
        return this.buildResult(context);
      }
    }

    return this.buildResult(this.completeContext(context));
  }

  public addStage(stage: TransitionPipelineStage, index?: number): void {
    if (index === undefined) {
      this.stages.push(stage);
      return;
    }

    const nextStages = [...this.stages];
    nextStages.splice(index, 0, stage);
    this.stages = nextStages;
  }

  public removeStage(stageId: string): void {
    const nextStages = this.stages.filter((stage) => stage.id !== stageId);
    this.stages = nextStages;
  }

  public replaceStage(stageId: string, nextStage: TransitionPipelineStage): void {
    const nextStages = this.stages.map((stage) => (stage.id === stageId ? nextStage : stage));
    this.stages = nextStages;
  }

  private createContext(request: TransitionPipelineRequest): TransitionPipelineContext {
    const currentState = normalizeFeedStatus(request.currentState) as FeedLifecycleState;
    const targetState = normalizeFeedStatus(request.targetState) as FeedLifecycleState;

    return {
      request,
      currentState,
      targetState,
      status: 'running',
      resolvedTransition: undefined,
      validationResult: undefined,
      guardResult: undefined,
      policyResult: undefined,
      executionResult: undefined,
      persistenceResult: undefined,
      loggingMetadata: {},
      metadata: {
        executionId: randomUUID(),
        correlationId: request.correlationId,
        startedAt: Date.now(),
        completedAt: undefined,
        requestSource: request.requestSource,
        executionMode: request.executionMode,
        stageResults: {},
        retryMetadata: {},
        monitoringMetadata: {},
        metricsMetadata: {},
        eventMetadata: {},
      },
      failure: undefined,
    };
  }

  private completeContext(context: TransitionPipelineContext): TransitionPipelineContext {
    return {
      ...context,
      status: context.status === 'running' ? 'success' : context.status,
      metadata: {
        ...context.metadata,
        completedAt: Date.now(),
      },
    };
  }

  private withFailure(
    context: TransitionPipelineContext,
    failure: TransitionPipelineFailure,
  ): TransitionPipelineContext {
    return {
      ...context,
      status: 'failure',
      failure,
      metadata: {
        ...context.metadata,
        completedAt: Date.now(),
      },
    };
  }

  private buildResult(context: TransitionPipelineContext): TransitionPipelineResult {
    return {
      status: context.status,
      context,
      failure: context.failure,
      validationReport: context.validationResult,
      guardReport: context.guardResult,
      policyReport: context.policyResult,
      executionMetadata: context.metadata,
      pipelineMetadata: {
        currentState: context.currentState,
        targetState: context.targetState,
        resolvedTransitionId: context.resolvedTransition?.id,
        stageCount: this.stages.length,
      },
    };
  }

  private shouldStop(context: TransitionPipelineContext): boolean {
    return (
      context.status === 'failure' ||
      context.status === 'rejected' ||
      context.status === 'cancelled'
    );
  }

  private toFailure(error: unknown, stageId: string): TransitionPipelineFailure {
    if (error instanceof TransitionPipelineFailure) {
      return error;
    }

    if (error instanceof Error) {
      return new UnexpectedStageFailure(error.message, { stageId, originalError: error.name });
    }

    return new PipelineExecutionFailure('An unexpected pipeline failure occurred.', {
      stageId,
      originalError: String(error),
    });
  }
}

export function createDefaultTransitionPipeline(): TransitionProcessingPipeline {
  return new TransitionProcessingPipeline(createDefaultStages());
}

function createDefaultStages(): readonly TransitionPipelineStage[] {
  return [
    createRegistryResolutionStage(),
    createValidationStage(),
    createGuardStage(),
    createPolicyStage(),
    createExecutionStage(),
    createPersistenceStage(),
    createLoggingStage(),
    createMetricsStage(),
    createEventStage(),
  ];
}

function createRegistryResolutionStage(): TransitionPipelineStage {
  return {
    id: 'registry-resolution',
    purpose: 'Resolve the transition definition from the lifecycle registry.',
    description: 'Maps the requested states to the registered transition definition.',
    run(context) {
      const transitionId = `${context.currentState.toLowerCase()}.${context.targetState.toLowerCase()}`;
      const resolvedTransition = getFeedLifecycleTransitionById(transitionId);

      return {
        ...context,
        resolvedTransition,
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            'registry-resolution': {
              transitionId,
              resolved: Boolean(resolvedTransition),
            },
          },
        },
      };
    },
  };
}

function createValidationStage(): TransitionPipelineStage {
  return {
    id: 'validation',
    purpose: 'Validate the transition request against the centralized validation registry.',
    description: 'Runs the shared lifecycle validation pipeline.',
    run(context) {
      const validationResult = validateTransitionRequest(context.request);

      if (!validationResult.success) {
        return {
          ...context,
          validationResult,
          status: 'rejected',
          failure: new ValidationFailure(validationResult.reason, {
            code: validationResult.code,
            stageId: 'validation',
            request: context.request,
          }),
          metadata: {
            ...context.metadata,
            stageResults: {
              ...context.metadata.stageResults,
              validation: {
                code: validationResult.code,
                reason: validationResult.reason,
              },
            },
          },
        };
      }

      return {
        ...context,
        validationResult,
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            validation: {
              code: validationResult.code,
              reason: validationResult.reason,
            },
          },
        },
      };
    },
  };
}

function createGuardStage(): TransitionPipelineStage {
  return {
    id: 'guard',
    purpose: 'Run the centralized guard pipeline.',
    description: 'Applies lifecycle guard checks before execution proceeds.',
    run(context) {
      const guardResult = evaluateTransitionGuards(context.request);

      if (!guardResult.allowed) {
        return {
          ...context,
          guardResult,
          status: 'rejected',
          failure: new GuardFailure(guardResult.reason, {
            code: guardResult.code,
            stageId: 'guard',
            request: context.request,
          }),
          metadata: {
            ...context.metadata,
            stageResults: {
              ...context.metadata.stageResults,
              guard: {
                code: guardResult.code,
                reason: guardResult.reason,
              },
            },
          },
        };
      }

      return {
        ...context,
        guardResult,
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            guard: {
              code: guardResult.code,
              reason: guardResult.reason,
            },
          },
        },
      };
    },
  };
}

function createPolicyStage(): TransitionPipelineStage {
  const engine = createLifecyclePolicyEngine();

  return {
    id: 'policy',
    purpose: 'Evaluate lifecycle policies before execution proceeds.',
    description: 'Runs the centralized lifecycle policy engine for business-rule evaluation.',
    run(context) {
      const policyInput: LifecyclePolicyEvaluationInput = {
        request: context.request,
        transitionDefinition: context.resolvedTransition,
        fromMetadata: undefined,
        toMetadata: undefined,
        guardResult: context.guardResult,
        validationResult: context.validationResult,
        configuration: undefined,
        environment: undefined,
        featureFlags: undefined,
        repositorySnapshot: undefined,
        metadata: {
          executionId: context.metadata.executionId,
          correlationId: context.metadata.correlationId,
          fromState: context.currentState,
          toState: context.targetState,
        },
      };

      const policyEvaluation = engine.evaluate(policyInput);

      if (!policyEvaluation.allowed) {
        return {
          ...context,
          policyResult: {
            status: policyEvaluation.status === 'deferred' ? 'deferred' : 'rejected',
            identifier: 'lifecycle.policy.engine',
            reason: policyEvaluation.reason,
            code: policyEvaluation.code,
            metadata: {
              ...policyEvaluation.metadata,
              policyResults: policyEvaluation.policyResults,
            },
          },
          status: 'rejected',
          failure: new GuardFailure(policyEvaluation.reason, {
            code: 'policy-rejection',
            stageId: 'policy',
            request: context.request,
            policyResults: policyEvaluation.policyResults,
          }),
          metadata: {
            ...context.metadata,
            stageResults: {
              ...context.metadata.stageResults,
              policy: {
                status: policyEvaluation.status,
                code: policyEvaluation.code,
              },
            },
          },
        };
      }

      return {
        ...context,
        policyResult: {
          status: policyEvaluation.status,
          identifier: 'lifecycle.policy.engine',
          reason: policyEvaluation.reason,
          code: policyEvaluation.code,
          metadata: {
            ...policyEvaluation.metadata,
            policyResults: policyEvaluation.policyResults,
          },
        },
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            policy: {
              status: policyEvaluation.status,
              code: policyEvaluation.code,
            },
          },
        },
      };
    },
  };
}

function createExecutionStage(): TransitionPipelineStage {
  return {
    id: 'execution',
    purpose: 'Reserve the execution extension point for future lifecycle service orchestration.',
    description: 'Current implementation records the execution as planned without mutating state.',
    run(context) {
      return {
        ...context,
        executionResult: {
          status: 'planned',
          identifier: 'lifecycle.execution.placeholder',
          reason: 'Execution is delegated to future lifecycle service orchestration.',
          code: 'planned',
          metadata: {
            fromState: context.currentState,
            toState: context.targetState,
          },
        },
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            execution: {
              status: 'planned',
              code: 'planned',
            },
          },
        },
      };
    },
  };
}

function createPersistenceStage(): TransitionPipelineStage {
  return {
    id: 'persistence',
    purpose: 'Reserve the persistence extension point for repositories.',
    description: 'Current implementation does not persist or mutate feed state.',
    run(context) {
      return {
        ...context,
        persistenceResult: {
          status: 'planned',
          identifier: 'lifecycle.persistence.placeholder',
          reason: 'Persistence is delegated to repositories in future integration stages.',
          code: 'planned',
          metadata: {
            fromState: context.currentState,
            toState: context.targetState,
          },
        },
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            persistence: {
              status: 'planned',
              code: 'planned',
            },
          },
        },
      };
    },
  };
}

function createLoggingStage(): TransitionPipelineStage {
  return {
    id: 'logging',
    purpose: 'Capture future logging context without implementing logging behavior.',
    description: 'Provides a placeholder for structured logging metadata.',
    run(context) {
      return {
        ...context,
        loggingMetadata: {
          executionId: context.metadata.executionId,
          transitionId: context.resolvedTransition?.id,
          status: context.status,
        },
        metadata: {
          ...context.metadata,
          stageResults: {
            ...context.metadata.stageResults,
            logging: {
              status: 'planned',
              code: 'planned',
            },
          },
        },
      };
    },
  };
}

function createMetricsStage(): TransitionPipelineStage {
  return {
    id: 'metrics',
    purpose: 'Capture future metrics without implementing metric collection.',
    description: 'Provides a placeholder for metrics metadata.',
    run(context) {
      return {
        ...context,
        metadata: {
          ...context.metadata,
          metricsMetadata: {
            transitionId: context.resolvedTransition?.id,
            validationSucceeded: context.validationResult?.success ?? false,
          },
          stageResults: {
            ...context.metadata.stageResults,
            metrics: {
              status: 'planned',
              code: 'planned',
            },
          },
        },
      };
    },
  };
}

function createEventStage(): TransitionPipelineStage {
  return {
    id: 'event',
    purpose: 'Capture future event metadata for downstream integrations.',
    description: 'Provides an extension point for domain event publication.',
    run(context) {
      return {
        ...context,
        metadata: {
          ...context.metadata,
          eventMetadata: {
            executionId: context.metadata.executionId,
            transitionId: context.resolvedTransition?.id,
          },
          stageResults: {
            ...context.metadata.stageResults,
            event: {
              status: 'planned',
              code: 'planned',
            },
          },
        },
      };
    },
  };
}
