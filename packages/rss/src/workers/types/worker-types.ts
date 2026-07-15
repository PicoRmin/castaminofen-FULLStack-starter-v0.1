export type WorkerRuntimeStatus = 'idle' | 'starting' | 'ready' | 'running' | 'stopping' | 'stopped' | 'failed';

export interface WorkerRegistration {
  readonly kind: string;
  readonly queueName: string;
  readonly runtimeFactory: () => Promise<unknown>;
}
