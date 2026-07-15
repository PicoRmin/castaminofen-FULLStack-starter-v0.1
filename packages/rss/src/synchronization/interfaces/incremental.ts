export interface IncrementalSynchronizationEngineLike {
  synchronize(request: {
    feedId: string;
    feedUrl: string;
    mode: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<unknown>;
}
