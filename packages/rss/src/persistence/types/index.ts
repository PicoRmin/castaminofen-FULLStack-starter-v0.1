import type { ImportPlan } from '../../import/deduplication';

export type PersistenceOperationType = 'create' | 'update' | 'upsert' | 'delete' | 'skip';

export interface RepositoryOperation {
  readonly entity: string;
  readonly action: PersistenceOperationType;
  readonly payload?: Record<string, unknown>;
  readonly id?: string;
  readonly context?: Record<string, unknown>;
  readonly order?: number;
}

export interface TransactionContext {
  readonly id: string;
  readonly parentId?: string | undefined;
  readonly depth: number;
  readonly startedAt: number;
  readonly timeoutMs?: number | undefined;
  readonly metadata: Record<string, unknown>;
  readonly correlationId?: string | undefined;
}

export interface TransactionOptions {
  readonly id?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
  readonly correlationId?: string | undefined;
  readonly parentContext?: TransactionContext | undefined;
}

export interface PersistenceWarning {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly severity: 'warning' | 'info';
  readonly entity?: string;
  readonly context?: Record<string, unknown>;
}

export interface PersistenceErrorInfo {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly entity?: string;
  readonly context?: Record<string, unknown>;
  readonly recovery?: string;
  readonly transactionId?: string;
}

export interface PersistenceStatistics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly skippedOperations: number;
  readonly durationMs: number;
  readonly committedEntities: number;
  readonly updatedEntities: number;
  readonly skippedEntities: number;
}

export interface TransactionInfo {
  readonly id: string;
  readonly parentId?: string | undefined;
  readonly depth: number;
  readonly startedAt: number;
  readonly completedAt?: number;
  readonly timeoutMs?: number;
  readonly metadata: Record<string, unknown>;
  readonly correlationId?: string | undefined;
}

export interface RollbackSummary {
  readonly reason: string;
  readonly failedEntity?: string | undefined;
  readonly completedOperations: readonly RepositoryExecutionResult[];
  readonly rolledBackOperations: readonly RepositoryExecutionResult[];
  readonly transaction: TransactionInfo;
  readonly recoveryRecommendation: string;
}

export interface RepositoryExecutionResult {
  readonly entity: string;
  readonly action: PersistenceOperationType;
  readonly success: boolean;
  readonly output?: unknown;
  readonly error?: string;
}

export interface RepositoryExecutionReport {
  readonly results: readonly RepositoryExecutionResult[];
  readonly warnings: readonly PersistenceWarning[];
  readonly errors: readonly PersistenceErrorInfo[];
  readonly completedEntities: readonly string[];
  readonly skippedEntities: readonly string[];
  readonly failedEntities: readonly string[];
}

export interface PersistenceRepository {
  execute(operation: RepositoryOperation, transactionContext?: TransactionContext): Promise<unknown>;
}

export interface RepositoryExecutionTarget {
  readonly name: string;
  readonly entity: string;
  readonly action: PersistenceOperationType;
  readonly repository: PersistenceRepository;
  readonly order?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface PersistenceRequest {
  readonly plan: ImportPlan;
  readonly repositories?: readonly RepositoryExecutionTarget[];
  readonly executionOrder?: readonly string[];
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly transactionOptions?: TransactionOptions;
}

export interface PersistenceResult {
  readonly success: boolean;
  readonly committedEntities: readonly string[];
  readonly updatedEntities: readonly string[];
  readonly skippedEntities: readonly string[];
  readonly failedEntities: readonly string[];
  readonly warnings: readonly PersistenceWarning[];
  readonly errors: readonly PersistenceErrorInfo[];
  readonly statistics: PersistenceStatistics;
  readonly transaction?: TransactionInfo;
  readonly rollback?: RollbackSummary;
  readonly durationMs: number;
}
