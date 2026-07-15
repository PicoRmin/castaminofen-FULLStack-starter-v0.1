export interface PersistenceLifecycleEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly timestamp: number;
  readonly transactionId?: string;
  readonly entity?: string;
  readonly context?: Record<string, unknown>;
}

export interface PersistenceStartedEvent extends PersistenceLifecycleEvent {
  readonly type: 'persistence-started';
}

export interface TransactionOpenedEvent extends PersistenceLifecycleEvent {
  readonly type: 'transaction-opened';
}

export interface RepositoryExecutedEvent extends PersistenceLifecycleEvent {
  readonly type: 'repository-executed';
}

export interface EntityPersistedEvent extends PersistenceLifecycleEvent {
  readonly type: 'entity-persisted';
}

export interface CommitCompletedEvent extends PersistenceLifecycleEvent {
  readonly type: 'commit-completed';
}

export interface RollbackCompletedEvent extends PersistenceLifecycleEvent {
  readonly type: 'rollback-completed';
}

export interface PersistenceCompletedEvent extends PersistenceLifecycleEvent {
  readonly type: 'persistence-completed';
}

export interface PersistenceFailedEvent extends PersistenceLifecycleEvent {
  readonly type: 'persistence-failed';
}

export type PersistenceEvent =
  | PersistenceStartedEvent
  | TransactionOpenedEvent
  | RepositoryExecutedEvent
  | EntityPersistedEvent
  | CommitCompletedEvent
  | RollbackCompletedEvent
  | PersistenceCompletedEvent
  | PersistenceFailedEvent;
