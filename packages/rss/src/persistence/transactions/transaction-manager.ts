import { randomUUID } from 'node:crypto';
import { TransactionFailureError } from '../errors';
import type { TransactionContext, TransactionOptions } from '../types';

export class TransactionManager {
  private readonly stack: TransactionContext[] = [];

  public constructor(
    private readonly dependencies?: {
      readonly executor?: <T>(work: () => Promise<T>, context: TransactionContext) => Promise<T>;
    },
  ) {}

  public async begin(options: TransactionOptions = {}): Promise<TransactionContext> {
    const parent = this.stack.at(-1);
    const parentId = options.parentContext?.id ?? parent?.id;
    const context: TransactionContext = {
      id: options.id ?? `txn-${randomUUID()}`,
      ...(parentId !== undefined ? { parentId } : {}),
      depth: (options.parentContext?.depth ?? parent?.depth ?? -1) + 1,
      startedAt: Date.now(),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      metadata: { ...(options.metadata ?? {}) },
      ...(options.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
    };

    this.stack.push(context);
    return context;
  }

  public async commit(context: TransactionContext): Promise<void> {
    if (this.stack.at(-1)?.id !== context.id) {
      throw new TransactionFailureError('The transaction context is not active.', {
        stage: 'commit',
        transactionId: context.id,
        entity: undefined,
        context: { depth: context.depth },
      });
    }

    this.stack.pop();
  }

  public async rollback(context: TransactionContext, reason: string): Promise<void> {
    if (this.stack.at(-1)?.id !== context.id) {
      throw new TransactionFailureError('The transaction context is not active.', {
        stage: 'rollback',
        transactionId: context.id,
        entity: undefined,
        context: { reason },
      });
    }

    this.stack.pop();
  }

  public async runInTransaction<T>(work: (context: TransactionContext) => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const context = await this.begin(options);

    try {
      const result = this.dependencies?.executor ? await this.dependencies.executor(() => work(context), context) : await work(context);
      await this.commit(context);
      return result;
    } catch (error) {
      await this.rollback(context, error instanceof Error ? error.message : 'Unknown transaction failure.');
      throw error;
    }
  }

  public getCurrentContext(): TransactionContext | undefined {
    return this.stack.at(-1);
  }
}
