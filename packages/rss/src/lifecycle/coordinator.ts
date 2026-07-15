import { randomUUID } from 'node:crypto';

import { createTransitionCommand, TransitionCommand } from './commands';
import { InvalidStateTransitionError } from './errors';
import {
  createDefaultTransitionPipeline,
  type TransitionPipelineRequest,
  type TransitionPipelineResult,
} from './pipeline';
import {
  createTransitionExecutionPlanningEngine,
  type TransitionExecutionPlan,
  type TransitionExecutionPlanningResult,
} from './planning-engine';
import type {
  FeedLifecycleHooks,
  FeedLifecycleLogger,
  FeedLifecycleTransitionRequest,
  FeedLifecycleTransitionResult,
} from './types';

export type TransitionExecutionStatus = 'success' | 'failure' | 'cancelled' | 'deferred';

export interface TransitionExecutionScope {
  readonly executionLifetime: 'single' | 'nested' | 'distributed' | 'future';
  readonly ownership: 'single-owner' | 'shared' | 'future';
  readonly boundaries: 'local' | 'external' | 'future';
  readonly nestedExecution: boolean;
  readonly childExecution: boolean;
  readonly distributedExecution: boolean;
}

export interface TransitionExecutionTransactionContext {
  readonly transactionScope: 'none' | 'local' | 'distributed' | 'future';
  readonly transactionMetadata: Readonly<Record<string, unknown>>;
  readonly rollbackPreparation: Readonly<Record<string, unknown>>;
  readonly compensationPlaceholder: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionCancellationContext {
  readonly requested: boolean;
  readonly reason: string | undefined;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionTimeoutContext {
  readonly executionTimeout: number | undefined;
  readonly planningTimeout: number | undefined;
  readonly workerTimeout: number | undefined;
  readonly retryTimeout: number | undefined;
  readonly schedulerTimeout: number | undefined;
}

export interface TransitionExecutionContext {
  readonly executionId: string;
  readonly correlationId: string | undefined;
  readonly causationId: string | undefined;
  readonly commandId: string | undefined;
  readonly pipelineId: string | undefined;
  readonly traceId: string | undefined;
  readonly scope: TransitionExecutionScope;
  readonly transaction: TransitionExecutionTransactionContext;
  readonly cancellation: TransitionExecutionCancellationContext;
  readonly timeout: TransitionExecutionTimeoutContext;
  readonly repositoryContext: Readonly<Record<string, unknown>>;
  readonly configurationSnapshot: Readonly<Record<string, unknown>>;
  readonly featureFlags: Readonly<Record<string, unknown>>;
  readonly environment: Readonly<Record<string, unknown>>;
  readonly tenantContext: Readonly<Record<string, unknown>>;
  readonly subscriptionContext: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionFailure {
  readonly message: string;
  readonly code: string;
  readonly stage: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionHooks {
  readonly beforeCoordination?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
  ) => void;
  readonly beforeValidation?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    request: TransitionPipelineRequest,
  ) => void;
  readonly afterValidation?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    validationResult: TransitionPipelineResult['context']['validationResult'],
  ) => void;
  readonly beforeDecision?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    pipelineResult: TransitionPipelineResult,
  ) => void;
  readonly afterDecision?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    decisionResult: TransitionPipelineResult['context']['decisionResult'],
  ) => void;
  readonly beforeLifecycle?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    plan: TransitionExecutionPlan,
  ) => void;
  readonly afterLifecycle?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly beforePersistence?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly afterPersistence?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly beforeLogging?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly afterLogging?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly beforeMetrics?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly afterMetrics?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly beforeEvents?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
  readonly afterEvents?: (
    context: TransitionExecutionContext,
    command: TransitionCommand,
    result: FeedLifecycleTransitionResult,
  ) => void;
}

export interface TransitionExecutionResult {
  readonly status: TransitionExecutionStatus;
  readonly context: TransitionExecutionContext;
  readonly executionResult: FeedLifecycleTransitionResult | undefined;
  readonly pipelineResult: TransitionPipelineResult;
  readonly planningResult: TransitionExecutionPlanningResult | undefined;
  readonly failure: TransitionExecutionFailure | undefined;
  readonly persistenceMetadata: Readonly<Record<string, unknown>>;
  readonly loggingMetadata: Readonly<Record<string, unknown>>;
  readonly metricsMetadata: Readonly<Record<string, unknown>>;
  readonly eventMetadata: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionLifecycleService {
  readonly executeTransition: (command: TransitionCommand) => FeedLifecycleTransitionResult;
}

export interface TransitionExecutionCoordinatorDependencies {
  readonly lifecycleService?: TransitionExecutionLifecycleService;
  readonly pipeline?: ReturnType<typeof createDefaultTransitionPipeline>;
  readonly planningEngine?: ReturnType<typeof createTransitionExecutionPlanningEngine>;
  readonly logger?: FeedLifecycleLogger;
  readonly hooks?: TransitionExecutionHooks;
}

export class TransitionExecutionCoordinator {
  private readonly pipeline: ReturnType<typeof createDefaultTransitionPipeline>;
  private readonly planningEngine: ReturnType<typeof createTransitionExecutionPlanningEngine>;

  constructor(private readonly dependencies: TransitionExecutionCoordinatorDependencies = {}) {
    this.pipeline = dependencies.pipeline ?? createDefaultTransitionPipeline();
    this.planningEngine = dependencies.planningEngine ?? createTransitionExecutionPlanningEngine();
  }

  public execute(
    request: FeedLifecycleTransitionRequest | TransitionCommand,
  ): TransitionExecutionResult {
    const command =
      request instanceof TransitionCommand ? request : createTransitionCommand(request);
    const context = this.createContext(command);

    this.dependencies.logger?.info?.('lifecycle.coordinator.started', {
      executionId: context.executionId,
      correlationId: context.correlationId,
      feedId: command.feed.id,
    });

    this.dependencies.hooks?.beforeCoordination?.(context, command);

    const pipelineRequest: TransitionPipelineRequest = {
      feedId: command.feed.id,
      currentState: command.transition.currentState,
      targetState: command.transition.targetState,
      actor: command.actor.id,
      correlationId: command.correlationId,
      metadata: (command.metadata.custom as Record<string, unknown> | undefined) ?? {},
      requestSource: 'transition-execution-coordinator',
      executionMode: 'sync',
    };

    this.dependencies.hooks?.beforeValidation?.(context, command, pipelineRequest);
    const pipelineResult = this.pipeline.execute(pipelineRequest);
    this.dependencies.hooks?.afterValidation?.(
      context,
      command,
      pipelineResult.context.validationResult,
    );

    if (pipelineResult.status !== 'success') {
      return this.createFailureResult(context, command, pipelineResult, 'pipeline', {
        pipelineStatus: pipelineResult.status,
      });
    }

    this.dependencies.hooks?.beforeDecision?.(context, command, pipelineResult);
    const decisionResult = pipelineResult.context.decisionResult;
    if (!decisionResult) {
      return this.createFailureResult(context, command, pipelineResult, 'decision', {
        reason: 'The centralized pipeline did not produce a decision result.',
      });
    }

    this.dependencies.hooks?.afterDecision?.(context, command, decisionResult);

    const planningResult = this.planningEngine.plan({
      decision: decisionResult,
      command,
      executionContext: {
        executionId: context.executionId,
        correlationId: context.correlationId,
        command,
        transition: command.transition,
        feed: command.feed,
        repositorySnapshot: context.repositoryContext,
        configurationSnapshot: context.configurationSnapshot,
        environment: context.environment,
        featureFlags: context.featureFlags,
        pipelineMetadata: pipelineResult.pipelineMetadata,
        tenantContext: context.tenantContext,
        subscriptionContext: context.subscriptionContext,
      },
    });

    if (planningResult.status !== 'created') {
      const failureCode = planningResult.status === 'deferred' ? 'deferred' : 'planning-failure';
      return {
        status: planningResult.status === 'deferred' ? 'deferred' : 'failure',
        context,
        executionResult: undefined,
        pipelineResult,
        planningResult,
        failure: {
          message:
            planningResult.failure?.message ??
            'Execution planning did not produce an execution plan.',
          code: failureCode,
          stage: 'planning',
          details: planningResult.failure?.details ?? {},
        },
        persistenceMetadata: {
          planned: false,
          reason: 'Execution planning did not finalize the orchestration contract.',
        },
        loggingMetadata: { planned: false },
        metricsMetadata: { planned: false },
        eventMetadata: { planned: false },
        metadata: {
          executionId: context.executionId,
          planningStatus: planningResult.status,
        },
      };
    }

    const plan = planningResult.plan;
    this.dependencies.hooks?.beforeLifecycle?.(context, command, plan);

    if (!this.dependencies.lifecycleService) {
      return this.createFailureResult(context, command, pipelineResult, 'lifecycle-service', {
        reason: 'No lifecycle domain service was provided to the coordinator.',
      });
    }

    const lifecycleResult = this.dependencies.lifecycleService.executeTransition(command);
    this.dependencies.hooks?.afterLifecycle?.(context, command, lifecycleResult);

    this.dependencies.hooks?.beforePersistence?.(context, command, lifecycleResult);
    const persistenceMetadata = {
      planned: true,
      executionId: context.executionId,
      transitionIdentifier: plan.executionId,
      futureRepository: true,
    };
    this.dependencies.hooks?.afterPersistence?.(context, command, lifecycleResult);

    this.dependencies.hooks?.beforeLogging?.(context, command, lifecycleResult);
    const loggingMetadata = {
      planned: true,
      executionId: context.executionId,
      correlationId: context.correlationId,
      futureLogging: true,
    };
    this.dependencies.hooks?.afterLogging?.(context, command, lifecycleResult);

    this.dependencies.hooks?.beforeMetrics?.(context, command, lifecycleResult);
    const metricsMetadata = {
      planned: true,
      executionId: context.executionId,
      futureMetrics: true,
    };
    this.dependencies.hooks?.afterMetrics?.(context, command, lifecycleResult);

    this.dependencies.hooks?.beforeEvents?.(context, command, lifecycleResult);
    const eventMetadata = {
      planned: true,
      executionId: context.executionId,
      futureEvents: true,
    };
    this.dependencies.hooks?.afterEvents?.(context, command, lifecycleResult);

    this.dependencies.logger?.info?.('lifecycle.coordinator.completed', {
      executionId: context.executionId,
      correlationId: context.correlationId,
      feedId: command.feed.id,
      nextState: lifecycleResult.nextState,
    });

    return {
      status: 'success',
      context,
      executionResult: lifecycleResult,
      pipelineResult,
      planningResult,
      failure: undefined,
      persistenceMetadata,
      loggingMetadata,
      metricsMetadata,
      eventMetadata,
      metadata: {
        executionId: context.executionId,
        planningId: plan.executionId,
        decisionId: decisionResult.decisionId,
        transitionId: plan.executionId,
      },
    };
  }

  private createContext(command: TransitionCommand): TransitionExecutionContext {
    return {
      executionId: randomUUID(),
      correlationId: command.correlationId,
      causationId: command.causationId,
      commandId: command.id,
      pipelineId: command.pipelineId,
      traceId: command.traceId,
      scope: {
        executionLifetime: 'single',
        ownership: 'single-owner',
        boundaries: 'local',
        nestedExecution: false,
        childExecution: false,
        distributedExecution: false,
      },
      transaction: {
        transactionScope: 'none',
        transactionMetadata: {},
        rollbackPreparation: {},
        compensationPlaceholder: {},
      },
      cancellation: {
        requested: false,
        reason: undefined,
        metadata: {},
      },
      timeout: {
        executionTimeout: undefined,
        planningTimeout: undefined,
        workerTimeout: undefined,
        retryTimeout: undefined,
        schedulerTimeout: undefined,
      },
      repositoryContext:
        (command.executionContext.repositorySnapshot as Record<string, unknown> | undefined) ?? {},
      configurationSnapshot:
        (command.executionContext.configurationSnapshot as Record<string, unknown> | undefined) ??
        {},
      featureFlags:
        (command.executionContext.featureFlags as Record<string, unknown> | undefined) ?? {},
      environment: {
        environment: command.executionContext.environment ?? 'unknown',
      },
      tenantContext: {},
      subscriptionContext: {},
    };
  }

  private createFailureResult(
    context: TransitionExecutionContext,
    command: TransitionCommand,
    pipelineResult: TransitionPipelineResult,
    stage: string,
    details: Record<string, unknown>,
  ): TransitionExecutionResult {
    const failureMessage =
      pipelineResult.failure?.message ??
      `Transition execution failed during ${stage} for feed ${command.feed.id}.`;

    this.dependencies.logger?.warn?.('lifecycle.coordinator.failed', {
      executionId: context.executionId,
      correlationId: context.correlationId,
      feedId: command.feed.id,
      stage,
      failureCode: pipelineResult.failure?.code,
    });

    return {
      status: 'failure',
      context,
      executionResult: undefined,
      pipelineResult,
      planningResult: undefined,
      failure: {
        message: failureMessage,
        code: pipelineResult.failure?.code ?? 'execution-coordinator-failure',
        stage,
        details,
      },
      persistenceMetadata: { planned: false, reason: 'Coordinator aborted before persistence.' },
      loggingMetadata: { planned: false },
      metricsMetadata: { planned: false },
      eventMetadata: { planned: false },
      metadata: {
        executionId: context.executionId,
        stage,
      },
    };
  }
}
