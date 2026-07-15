import { randomUUID } from 'node:crypto';
import { PersistenceConsistencyError, PersistenceCoordinatorError, RollbackFailureError } from '../errors';
import type { PersistenceEventListener } from '../interfaces';
import { RepositoryCoordinator } from './repository-coordinator';
import type { PersistenceRequest, PersistenceResult, RepositoryExecutionReport, RollbackSummary, TransactionContext, TransactionInfo, TransactionOptions } from '../types';
import { TransactionManager } from '../transactions/transaction-manager';

export class PersistenceCoordinator {
  private readonly transactionManager: TransactionManager;
  private readonly repositoryCoordinator: RepositoryCoordinator;
  private readonly listeners: PersistenceEventListener[] = [];

  public constructor(
    private readonly dependencies: {
      readonly repositories?: readonly { name: string; entity: string; action: 'create' | 'update' | 'upsert' | 'delete' | 'skip'; order?: number; metadata?: Record<string, unknown>; repository: { execute(operation: { entity: string; action: 'create' | 'update' | 'upsert' | 'delete' | 'skip'; payload?: Record<string, unknown>; context?: Record<string, unknown>; order?: number }, transactionContext?: { id: string; parentId?: string; depth: number; startedAt: number; timeoutMs?: number; metadata: Record<string, unknown>; correlationId?: string }): Promise<unknown> } }[];
      readonly transactionOptions?: TransactionOptions;
      readonly executionOrder?: readonly string[];
      readonly onEvent?: PersistenceEventListener;
    } = {},
  ) {
    this.transactionManager = new TransactionManager();
    this.repositoryCoordinator = new RepositoryCoordinator({ onEvent: this.dispatchEvent.bind(this) as (event: { type: string; stage: string; message: string; timestamp?: number; context?: Record<string, unknown> }) => void | Promise<void> });
    if (dependencies.onEvent) {
      this.listeners.push(dependencies.onEvent);
    }
  }

  public async execute(request: PersistenceRequest): Promise<PersistenceResult> {
    const startedAt = Date.now();
    const repositories = request.repositories ?? this.dependencies.repositories ?? [];
    if (!request.plan || repositories.length === 0) {
      throw new PersistenceCoordinatorError('The persistence request is missing the required plan or repository targets.', {
        stage: 'prepare',
        entity: undefined as string | undefined,
        context: { correlationId: request.correlationId },
      });
    }

    const transactionOptions: TransactionOptions = {
      id: request.transactionOptions?.id ?? `tx-${randomUUID()}`,
      ...(request.transactionOptions?.timeoutMs !== undefined ? { timeoutMs: request.transactionOptions.timeoutMs } : {}),
      metadata: { ...(request.metadata ?? {}), planType: 'import-plan' },
      ...(request.correlationId !== undefined ? { correlationId: request.correlationId } : {}),
      ...(request.transactionOptions?.parentContext !== undefined ? { parentContext: request.transactionOptions.parentContext } : {}),
    };

    const transactionContext = await this.transactionManager.begin(transactionOptions);
    await this.dispatchEvent({ type: 'transaction-opened', stage: 'transaction', message: 'Transaction opened', timestamp: Date.now(), transactionId: transactionContext.id, context: { correlationId: request.correlationId } });

    let report: RepositoryExecutionReport | undefined;
    try {
      await this.dispatchEvent({ type: 'persistence-started', stage: 'persist', message: 'Persistence started', timestamp: Date.now(), transactionId: transactionContext.id, context: { entityCount: repositories.length } });
      report = await this.repositoryCoordinator.execute(
        repositories,
        transactionContext,
        request.executionOrder,
      );

      const success = report.failedEntities.length === 0;
      if (!success) {
        throw new PersistenceConsistencyError('One or more repository operations failed.', {
          stage: 'persist',
          transactionId: transactionContext.id,
          entity: report.failedEntities[0] ?? undefined,
          context: { failedEntities: report.failedEntities },
          recovery: 'Review the repository failures and rerun the same plan after repairing the failing entity.',
        });
      }

      await this.transactionManager.commit(transactionContext);
      await this.dispatchEvent({ type: 'commit-completed', stage: 'commit', message: 'Commit completed', timestamp: Date.now(), transactionId: transactionContext.id, context: { entities: report.completedEntities } });
      await this.dispatchEvent({ type: 'persistence-completed', stage: 'persist', message: 'Persistence completed', timestamp: Date.now(), transactionId: transactionContext.id, context: { entityCount: report.completedEntities.length } });

      return this.toResult(true, request, report, transactionContext, undefined, startedAt);
    } catch (error) {
      const rollbackReason = error instanceof Error ? error.message : 'Unknown persistence failure.';
      const rollbackSummary = await this.rollback(transactionContext, this.getErrorMessage(error), report);
      await this.dispatchEvent({ type: 'rollback-completed', stage: 'rollback', message: 'Rollback completed', timestamp: Date.now(), transactionId: transactionContext.id, context: { reason: rollbackSummary.reason } });
      await this.dispatchEvent({ type: 'persistence-failed', stage: 'persist', message: 'Persistence failed', timestamp: Date.now(), transactionId: transactionContext.id, context: { reason: rollbackSummary.reason } });
      return this.toResult(false, request, report ?? { results: [], warnings: [], errors: [], completedEntities: [], skippedEntities: [], failedEntities: [] }, transactionContext, rollbackSummary, startedAt);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown persistence failure.';
  }

  private async rollback(transactionContext: TransactionContext, reason: string, report?: RepositoryExecutionReport): Promise<RollbackSummary> {
    try {
      await this.transactionManager.rollback(transactionContext, reason);
    } catch (error) {
      throw new RollbackFailureError('Rollback failed to unwind the transaction context.', {
        stage: 'rollback',
        transactionId: transactionContext.id,
        entity: report?.failedEntities[0] ?? undefined,
        context: { reason },
        cause: error,
      });
    }

    return {
      reason,
      failedEntity: report?.failedEntities[0] ?? undefined,
      completedOperations: report?.results.filter((result) => result.success) ?? [],
      rolledBackOperations: [],
      transaction: this.toTransactionInfo(transactionContext),
      recoveryRecommendation: 'Inspect the repository outputs and retry the same import plan after the underlying cause is resolved.',
    };
  }

  private toResult(
    success: boolean,
    request: PersistenceRequest,
    report: RepositoryExecutionReport,
    transactionContext: TransactionContext,
    rollback: RollbackSummary | undefined,
    startedAt: number,
  ): PersistenceResult {
    const committedEntities = success ? [...report.completedEntities] : [];
    const updatedEntities = success ? report.completedEntities.filter((entity) => entity.includes('update')) : [];
    const skippedEntities = report.skippedEntities;
    const failedEntities = report.failedEntities;
    return {
      success,
      committedEntities,
      updatedEntities,
      skippedEntities,
      failedEntities,
      warnings: report.warnings,
      errors: report.errors,
      statistics: {
        totalOperations: report.results.length,
        successfulOperations: report.results.filter((result) => result.success).length,
        failedOperations: report.results.filter((result) => !result.success).length,
        skippedOperations: skippedEntities.length,
        durationMs: Date.now() - startedAt,
        committedEntities: committedEntities.length,
        updatedEntities: updatedEntities.length,
        skippedEntities: skippedEntities.length,
      },
      transaction: this.toTransactionInfo(transactionContext),
      ...(rollback ? { rollback } : {}),
      durationMs: Date.now() - startedAt,
    };
  }

  private toTransactionInfo(context: TransactionContext): TransactionInfo {
    return {
      id: context.id,
      ...(context.parentId !== undefined ? { parentId: context.parentId } : {}),
      depth: context.depth,
      startedAt: context.startedAt,
      completedAt: Date.now(),
      ...(context.timeoutMs !== undefined ? { timeoutMs: context.timeoutMs } : {}),
      metadata: context.metadata,
      ...(context.correlationId !== undefined ? { correlationId: context.correlationId } : {}),
    };
  }

  private async dispatchEvent(event: { type: string; stage: string; message: string; timestamp: number; transactionId?: string; entity?: string; context?: Record<string, unknown> }): Promise<void> {
    for (const listener of this.listeners) {
      await listener(event as Parameters<PersistenceEventListener>[0]);
    }
  }
}
