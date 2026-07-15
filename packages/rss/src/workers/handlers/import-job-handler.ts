import type { JobContext } from '../context/job-context';
import type { ImportService } from '../../import/service';

export interface ImportJobHandlerDependencies {
  readonly importService: ImportService;
}

export class ImportJobHandler {
  private readonly importService: ImportService;

  public constructor(dependencies: ImportJobHandlerDependencies) {
    this.importService = dependencies.importService;
  }

  public async execute(context: JobContext): Promise<unknown> {
    const payload = context.job.payload as { url?: string; feedUrl?: string } | undefined;
    const feedUrl = payload?.feedUrl ?? payload?.url ?? '';
    return this.importService.import({
      feedUrl,
      mode: 'initial',
      correlationId: context.correlationId,
      metadata: { workerId: context.workerId, executionId: context.executionId },
      options: { transaction: false },
    });
  }
}
