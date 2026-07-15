import type { QueueDefinition } from '../types/queue-definition';
import type { QueueJobEnvelope } from '../contracts/queue-job-contract';

export interface QueueAdapter<TQueue = unknown> {
  readonly name: string;
  createQueue(definition: QueueDefinition): Promise<TQueue>;
  getQueue(name: string): Promise<TQueue | undefined>;
  enqueue(job: QueueJobEnvelope): Promise<string>;
  close(): Promise<void>;
}
