import type { JobContext } from '../context/job-context';

export interface WorkerHandler<TContext extends JobContext = JobContext, TResult = unknown> {
  readonly kind: string;
  execute(context: TContext): Promise<TResult>;
}
