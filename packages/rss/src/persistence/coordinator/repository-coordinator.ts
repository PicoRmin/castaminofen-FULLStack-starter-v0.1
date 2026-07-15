import { ExecutionOrderError, RepositoryExecutionError } from '../errors';
import type { PersistenceWarning, RepositoryExecutionResult, RepositoryExecutionTarget, TransactionContext } from '../types';

export type { RepositoryExecutionTarget } from '../types';

export class RepositoryCoordinator {
  public constructor(
    private readonly dependencies?: {
      readonly onEvent?: (event: { type: string; stage: string; message: string; timestamp?: number; context?: Record<string, unknown> }) => void | Promise<void>;
    },
  ) {}

  public async execute(
    targets: readonly RepositoryExecutionTarget[],
    transactionContext: TransactionContext,
    order?: readonly string[],
  ): Promise<{ results: readonly RepositoryExecutionResult[]; warnings: readonly PersistenceWarning[]; errors: readonly { code: string; message: string; stage: string; entity?: string; context?: Record<string, unknown>; recovery?: string; transactionId?: string }[]; completedEntities: readonly string[]; skippedEntities: readonly string[]; failedEntities: readonly string[] }> {
    const orderedTargets = this.orderTargets(targets, order);
    const results: RepositoryExecutionResult[] = [];
    const warnings: PersistenceWarning[] = [];
    const errors: Array<{ code: string; message: string; stage: string; entity?: string; context?: Record<string, unknown>; recovery?: string; transactionId?: string }> = [];
    const completedEntities: string[] = [];
    const skippedEntities: string[] = [];
    const failedEntities: string[] = [];

    for (const target of orderedTargets) {
      const operation = {
        entity: target.entity,
        action: target.action,
        payload: target.metadata ? { metadata: target.metadata } : {},
        context: { transactionId: transactionContext.id, entity: target.entity },
        ...(target.order !== undefined ? { order: target.order } : {}),
      };

      try {
        await this.dependencies?.onEvent?.({ type: 'repository-executed', stage: 'persist', message: `Executed repository ${target.name}`, context: { entity: target.entity, transactionId: transactionContext.id } });
        const output = await target.repository.execute(operation, transactionContext);
        results.push({ entity: target.entity, action: target.action, success: true, output });
        completedEntities.push(target.entity);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Repository execution failed.';
        const repositoryError = new RepositoryExecutionError(message, {
          stage: 'persist',
          transactionId: transactionContext.id,
          entity: target.entity,
          context: { repositoryName: target.name },
          cause: error,
          recovery: 'Re-run the transaction after correcting the repository operation.',
        });
        results.push({ entity: target.entity, action: target.action, success: false, error: repositoryError.message });
        failedEntities.push(target.entity);
        errors.push({
          code: repositoryError.code,
          message: repositoryError.message,
          stage: repositoryError.stage,
          ...(repositoryError.entity !== undefined ? { entity: repositoryError.entity } : {}),
          context: repositoryError.context,
          ...(repositoryError.recovery !== undefined ? { recovery: repositoryError.recovery } : {}),
          ...(repositoryError.transactionId !== undefined ? { transactionId: repositoryError.transactionId } : {}),
        });
        break;
      }
    }

    return {
      results,
      warnings,
      errors,
      completedEntities,
      skippedEntities,
      failedEntities,
    };
  }

  private orderTargets(targets: readonly RepositoryExecutionTarget[], order?: readonly string[]): readonly RepositoryExecutionTarget[] {
    const explicitOrder = order ?? [];
    if (explicitOrder.length === 0) {
      return [...targets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    const available = [...targets];
    const ordered: RepositoryExecutionTarget[] = [];
    for (const entity of explicitOrder) {
      const index = available.findIndex((target) => target.entity === entity);
      if (index === -1) {
        continue;
      }
      const target = available.splice(index, 1)[0];
      if (target) {
        ordered.push(target);
      }
    }
    ordered.push(...available.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    if (ordered.length !== targets.length) {
      throw new ExecutionOrderError('The configured execution order is incomplete for the supplied repositories.', {
        stage: 'persist',
        entity: undefined as string | undefined,
        context: { requestedOrder: explicitOrder, suppliedEntities: targets.map((target) => target.entity) },
      });
    }
    return ordered;
  }
}
