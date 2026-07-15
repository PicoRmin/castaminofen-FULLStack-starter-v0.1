export interface SynchronizationStateStore {
  load(request: {
    feedId?: string;
    feedUrl?: string;
    correlationId?: string | undefined;
  }): Promise<unknown>;
  save(state: unknown): Promise<void>;
}

export * from './feed-state';
export * from './incremental';
export * from './locking';

export interface SynchronizationEventHook {
  (event: {
    type: string;
    stage: string;
    message: string;
    timestamp?: number | undefined;
    context?: Record<string, unknown> | undefined;
  }): void | Promise<void>;
}

export interface SynchronizationImportService {
  import(request: {
    feedUrl: string;
    mode: string;
    correlationId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    options?: Record<string, unknown> | undefined;
  }): Promise<{
    success: boolean;
    createdEntities?: readonly string[];
    updatedEntities?: readonly string[];
    skippedEntities?: readonly string[];
    warnings?: readonly unknown[];
    conflicts?: readonly unknown[];
    errors?: readonly unknown[];
    statistics?: Record<string, unknown>;
    durationMs?: number;
    providerMetadata?: Record<string, unknown>;
    parserMetadata?: Record<string, unknown>;
    mode?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface SynchronizationPersistenceCoordinator {
  execute(request: {
    plan?: unknown | undefined;
    repositories?: readonly unknown[] | undefined;
    executionOrder?: readonly string[] | undefined;
    correlationId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    transactionOptions?: Record<string, unknown> | undefined;
  }): Promise<{
    success: boolean;
    committedEntities?: readonly string[];
    updatedEntities?: readonly string[];
    skippedEntities?: readonly string[];
    failedEntities?: readonly string[];
    warnings?: readonly unknown[];
    errors?: readonly unknown[];
    statistics?: Record<string, unknown>;
    durationMs?: number;
  }>;
}
