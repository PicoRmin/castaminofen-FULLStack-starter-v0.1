import type { JobContext } from '../context/job-context';

export class MaintenanceJobHandler {
  public async execute(context: JobContext): Promise<unknown> {
    return {
      ok: true,
      jobId: context.jobId,
      maintenance: 'scheduled',
      executionId: context.executionId,
    };
  }
}
