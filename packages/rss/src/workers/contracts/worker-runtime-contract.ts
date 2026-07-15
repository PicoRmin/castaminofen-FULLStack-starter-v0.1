import type { JobContext } from '../context/job-context';
import type { WorkerConfiguration } from './worker-configuration';

export interface WorkerDispatchResult {
  readonly status: 'completed' | 'failed' | 'cancelled';
  readonly jobId: string;
  readonly correlationId: string;
  readonly workerId: string;
  readonly result?: unknown;
  readonly error?: unknown;
}

export interface WorkerRuntime {
  readonly workerId: string;
  readonly queueName: string;
  readonly configuration: WorkerConfiguration;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispatch(context: JobContext): Promise<WorkerDispatchResult>;
}
