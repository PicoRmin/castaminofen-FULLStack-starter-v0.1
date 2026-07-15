import type { JobContext } from '../context/job-context';
import type { WorkerHandler } from '../contracts/worker-handler-contract';
import type { InMemoryHandlerRegistry } from './in-memory-handler-registry';

export class RegistryBasedHandler implements WorkerHandler {
  public readonly kind: string;

  public constructor(
    private readonly registry: InMemoryHandlerRegistry,
    kind: string,
  ) {
    this.kind = kind;
  }

  public async execute(context: JobContext): Promise<unknown> {
    const handler = this.registry.get(context.job.jobType);
    if (!handler) {
      throw new Error(`No handler registered for job kind ${context.job.jobType}`);
    }
    return handler.execute(context);
  }
}
