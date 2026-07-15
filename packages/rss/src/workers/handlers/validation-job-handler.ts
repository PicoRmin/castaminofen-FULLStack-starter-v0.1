import type { JobContext } from '../context/job-context';

export class ValidationJobHandler {
  public async execute(context: JobContext): Promise<unknown> {
    return {
      ok: true,
      jobId: context.jobId,
      validation: 'ready',
      executionId: context.executionId,
    };
  }
}
