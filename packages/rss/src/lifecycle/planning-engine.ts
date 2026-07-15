import { randomUUID } from 'node:crypto';

import type {
  TransitionCommand,
  TransitionCommandFeed,
  TransitionCommandTransition,
} from './commands';
import type { TransitionDecisionResult } from './decision-engine';

export type ExecutionPlanStrategy =
  | 'immediate'
  | 'deferred'
  | 'background'
  | 'manual'
  | 'administrative'
  | 'scheduled'
  | 'recovery'
  | 'retry'
  | 'migration'
  | 'maintenance';

export type ExecutionPlanMode = 'sync' | 'async' | 'background' | 'manual' | 'administrative';

export interface ExecutionPlanStage {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sequence: number;
  readonly dependsOn: readonly string[];
}

export interface ExecutionPlanDependency {
  readonly id: string;
  readonly kind:
    'required' | 'optional' | 'conditional' | 'future-async' | 'future-plugin' | 'future-provider';
  readonly sourceStageId: string;
  readonly targetStageId: string;
  readonly description: string;
}

export interface TransitionExecutionPlan {
  readonly executionId: string;
  readonly executionStrategy: ExecutionPlanStrategy;
  readonly executionMode: ExecutionPlanMode;
  readonly stages: readonly ExecutionPlanStage[];
  readonly dependencies: readonly ExecutionPlanDependency[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly expectedOutputs: readonly string[];
  readonly futureRecoveryMetadata: Readonly<Record<string, unknown>>;
  readonly futureRetryMetadata: Readonly<Record<string, unknown>>;
  readonly futureLoggingMetadata: Readonly<Record<string, unknown>>;
  readonly futureMetricsMetadata: Readonly<Record<string, unknown>>;
  readonly futureAuditMetadata: Readonly<Record<string, unknown>>;
  readonly futureEventMetadata: Readonly<Record<string, unknown>>;
  readonly futureNotificationMetadata: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionPlanningContext {
  readonly executionId: string;
  readonly correlationId?: string;
  readonly command: TransitionCommand;
  readonly decision?: TransitionDecisionResult | undefined;
  readonly transition: TransitionCommandTransition;
  readonly feed: TransitionCommandFeed;
  readonly repositorySnapshot?: Readonly<Record<string, unknown>>;
  readonly configurationSnapshot?: Readonly<Record<string, unknown>>;
  readonly environment?: Readonly<Record<string, unknown>>;
  readonly featureFlags?: Readonly<Record<string, unknown>>;
  readonly pipelineMetadata?: Readonly<Record<string, unknown>>;
  readonly tenantContext?: Readonly<Record<string, unknown>>;
  readonly subscriptionContext?: Readonly<Record<string, unknown>>;
  readonly regionalContext?: Readonly<Record<string, unknown>>;
}

export interface TransitionExecutionPlanningInput {
  readonly decision: TransitionDecisionResult;
  readonly command: TransitionCommand;
  readonly executionContext: TransitionExecutionPlanningContext;
}

export interface TransitionExecutionPlanningResult {
  readonly status: 'created' | 'rejected' | 'deferred' | 'failure';
  readonly plan: TransitionExecutionPlan;
  readonly planningMetadata: Readonly<Record<string, unknown>>;
  readonly failure?: PlanningFailure | undefined;
}

export interface PlanningFailureDetails {
  readonly code: string;
  readonly details: Record<string, unknown>;
}

export class PlanningFailure extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  constructor(message: string, code: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'PlanningFailure';
    this.code = code;
    this.details = details;
  }
}

export class MissingDecision extends PlanningFailure {
  constructor(details: Record<string, unknown> = {}) {
    super(
      'A decision result is required before an execution plan can be created.',
      'missing-decision',
      details,
    );
    this.name = 'MissingDecision';
  }
}

export class MissingCommand extends PlanningFailure {
  constructor(details: Record<string, unknown> = {}) {
    super(
      'A transition command is required before planning can proceed.',
      'missing-command',
      details,
    );
    this.name = 'MissingCommand';
  }
}

export class MissingTransition extends PlanningFailure {
  constructor(details: Record<string, unknown> = {}) {
    super(
      'The transition payload is missing the required state transition definition.',
      'missing-transition',
      details,
    );
    this.name = 'MissingTransition';
  }
}

export class MissingExecutionContext extends PlanningFailure {
  constructor(details: Record<string, unknown> = {}) {
    super('Execution planning requires a planning context.', 'missing-execution-context', details);
    this.name = 'MissingExecutionContext';
  }
}

export class UnsupportedStrategy extends PlanningFailure {
  constructor(details: Record<string, unknown> = {}) {
    super(
      'The requested execution strategy is not supported by the planning engine.',
      'unsupported-strategy',
      details,
    );
    this.name = 'UnsupportedStrategy';
  }
}

export class PlanningConfigurationFailure extends PlanningFailure {
  constructor(details: Record<string, unknown> = {}) {
    super(
      'The planning engine configuration is invalid.',
      'planning-configuration-failure',
      details,
    );
    this.name = 'PlanningConfigurationFailure';
  }
}

export interface TransitionExecutionPlanningEngine {
  readonly plan: (input: TransitionExecutionPlanningInput) => TransitionExecutionPlanningResult;
}

export function createTransitionExecutionPlanningEngine(): TransitionExecutionPlanningEngine {
  return {
    plan(input) {
      const command = input.command;
      const decision = input.decision;
      const context = input.executionContext;

      if (!decision) {
        return createFailureResult(new MissingDecision(), context, command);
      }

      if (!command) {
        return createFailureResult(new MissingCommand(), context, command);
      }

      if (!context) {
        return createFailureResult(new MissingExecutionContext(), context, command);
      }

      if (!command.transition?.currentState || !command.transition?.targetState) {
        return createFailureResult(new MissingTransition(), context, command);
      }

      const strategy = resolveStrategy(decision, command);
      const executionMode = resolveExecutionMode(strategy, command, context);
      const stages = createStages(strategy);
      const dependencies = createDependencies(stages);
      const plan = freezeValue<TransitionExecutionPlan>({
        executionId: context.executionId ?? decision.executionIdentifier ?? `plan-${randomUUID()}`,
        executionStrategy: strategy,
        executionMode,
        stages,
        dependencies,
        metadata: freezeValue({
          decisionId: decision.decisionId,
          transitionIdentifier: decision.transitionIdentifier,
          sourceState: decision.sourceState,
          targetState: decision.targetState,
          correlationId: context.correlationId ?? decision.correlationIdentifier,
          commandId: command.id,
          version: '1.0.0',
          compatibility: ['decision-engine', 'transition-command', 'lifecycle-pipeline'],
        }),
        expectedOutputs: ['execution-plan', 'execution-metadata', 'future-audit-metadata'],
        futureRecoveryMetadata: freezeValue({ enabled: true, strategy }),
        futureRetryMetadata: freezeValue({
          enabled: decision.futureRetryMetadata !== undefined,
          strategy,
        }),
        futureLoggingMetadata: freezeValue({ enabled: true, correlationId: context.correlationId }),
        futureMetricsMetadata: freezeValue({ enabled: true, executionId: context.executionId }),
        futureAuditMetadata: freezeValue({ enabled: true, decisionId: decision.decisionId }),
        futureEventMetadata: freezeValue({
          enabled: true,
          transitionIdentifier: decision.transitionIdentifier,
        }),
        futureNotificationMetadata: freezeValue({
          enabled: true,
          priority: decision.decisionPriority,
        }),
      });

      const planningMetadata = freezeValue({
        createdAt: new Date().toISOString(),
        executionStrategy: strategy,
        executionMode,
        correlationId: context.correlationId ?? decision.correlationIdentifier,
        executionId: plan.executionId,
        compatibility: ['transition-command', 'decision-engine', 'future-worker-layer'],
      });

      if (decision.decisionType === 'DEFER') {
        return {
          status: 'deferred',
          plan,
          planningMetadata,
        };
      }

      if (decision.decisionType === 'REJECT' || decision.decisionType === 'CANCEL') {
        return {
          status: 'rejected',
          plan,
          planningMetadata,
        };
      }

      return {
        status: 'created',
        plan,
        planningMetadata,
      };
    },
  };
}

function createFailureResult(
  failure: PlanningFailure,
  context: TransitionExecutionPlanningContext | undefined,
  command: TransitionCommand | undefined,
): TransitionExecutionPlanningResult {
  const executionId = context?.executionId ?? `plan-${randomUUID()}`;
  const plan = freezeValue<TransitionExecutionPlan>({
    executionId,
    executionStrategy: 'manual',
    executionMode: 'manual',
    stages: [],
    dependencies: [],
    metadata: freezeValue({ failure: failure.code, commandId: command?.id }),
    expectedOutputs: [],
    futureRecoveryMetadata: freezeValue({ enabled: false }),
    futureRetryMetadata: freezeValue({ enabled: false }),
    futureLoggingMetadata: freezeValue({ enabled: false }),
    futureMetricsMetadata: freezeValue({ enabled: false }),
    futureAuditMetadata: freezeValue({ enabled: false }),
    futureEventMetadata: freezeValue({ enabled: false }),
    futureNotificationMetadata: freezeValue({ enabled: false }),
  });

  return {
    status: 'failure',
    plan,
    planningMetadata: freezeValue({
      createdAt: new Date().toISOString(),
      executionStrategy: 'manual',
      executionMode: 'manual',
      correlationId: context?.correlationId,
      executionId,
      compatibility: ['transition-command', 'decision-engine', 'future-worker-layer'],
    }),
    failure,
  };
}

function resolveStrategy(
  decision: TransitionDecisionResult,
  command: TransitionCommand,
): ExecutionPlanStrategy {
  if (decision.decisionType === 'DEFER') {
    return 'deferred';
  }

  if (decision.decisionType === 'REJECT' || decision.decisionType === 'CANCEL') {
    return 'manual';
  }

  if (
    decision.decisionPriority === 'administrative-override' ||
    decision.decisionPriority === 'emergency-override'
  ) {
    return 'administrative';
  }

  if (command.transition.type === 'recovery' || command.transition.type === 'failure') {
    return 'recovery';
  }

  if (command.transition.category === 'background' || command.transition.category === 'scheduled') {
    return 'background';
  }

  if (decision.metadata?.executionStrategy === 'scheduled') {
    return 'scheduled';
  }

  return 'immediate';
}

function resolveExecutionMode(
  strategy: ExecutionPlanStrategy,
  command: TransitionCommand,
  context: TransitionExecutionPlanningContext,
): ExecutionPlanMode {
  if (strategy === 'background' || command.transition.category === 'background') {
    return 'background';
  }

  if (strategy === 'administrative' || context.featureFlags?.planningEngine === true) {
    return 'administrative';
  }

  if (context.pipelineMetadata?.executionMode === 'async') {
    return 'async';
  }

  return 'sync';
}

function createStages(strategy: ExecutionPlanStrategy): readonly ExecutionPlanStage[] {
  const baseStages: readonly ExecutionPlanStage[] = [
    {
      id: 'pre-validation',
      name: 'Pre Validation',
      description: 'Validate the planning context and transition prerequisites.',
      sequence: 1,
      dependsOn: [],
    },
    {
      id: 'pre-execution',
      name: 'Pre Execution',
      description: 'Prepare the execution context and extension hooks.',
      sequence: 2,
      dependsOn: ['pre-validation'],
    },
    {
      id: 'transition-execution',
      name: 'Transition Execution',
      description: 'Plan the transition execution without mutating state.',
      sequence: 3,
      dependsOn: ['pre-execution'],
    },
    {
      id: 'post-execution',
      name: 'Post Execution',
      description: 'Record the planned transition outcomes for downstream orchestration.',
      sequence: 4,
      dependsOn: ['transition-execution'],
    },
    {
      id: 'persistence',
      name: 'Persistence',
      description: 'Prepare persistence metadata only; persistence is not executed by the planner.',
      sequence: 5,
      dependsOn: ['post-execution'],
    },
    {
      id: 'logging',
      name: 'Logging',
      description: 'Prepare logging metadata for future execution.',
      sequence: 6,
      dependsOn: ['persistence'],
    },
    {
      id: 'metrics',
      name: 'Metrics',
      description: 'Prepare metrics emission metadata for future execution.',
      sequence: 7,
      dependsOn: ['logging'],
    },
    {
      id: 'audit',
      name: 'Audit',
      description: 'Prepare audit metadata for future execution.',
      sequence: 8,
      dependsOn: ['metrics'],
    },
    {
      id: 'domain-events',
      name: 'Domain Events',
      description: 'Prepare domain event metadata for future execution.',
      sequence: 9,
      dependsOn: ['audit'],
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Prepare notification metadata for future execution.',
      sequence: 10,
      dependsOn: ['domain-events'],
    },
  ];

  if (strategy === 'deferred' || strategy === 'recovery' || strategy === 'retry') {
    return baseStages.filter((stage) => stage.id !== 'transition-execution');
  }

  return baseStages;
}

function createDependencies(
  stages: readonly ExecutionPlanStage[],
): readonly ExecutionPlanDependency[] {
  return stages.flatMap((stage) =>
    stage.dependsOn.map((dependencyId, index) => ({
      id: `${dependencyId}-${stage.id}-${index}`,
      kind: 'required' as const,
      sourceStageId: dependencyId,
      targetStageId: stage.id,
      description: `Stage ${stage.id} depends on ${dependencyId}.`,
    })),
  );
}

function freezeValue<T>(value: T): T {
  if (Array.isArray(value)) {
    const next = value.map((entry) => freezeValue(entry));
    return Object.freeze(next) as T;
  }

  if (value && typeof value === 'object') {
    const next = Object.entries(value).reduce<Record<string, unknown>>(
      (accumulator, [key, nested]) => {
        accumulator[key] = freezeValue(nested);
        return accumulator;
      },
      {},
    );
    return Object.freeze(next) as T;
  }

  return value;
}
