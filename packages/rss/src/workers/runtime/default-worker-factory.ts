import type { WorkerConfiguration } from '../contracts/worker-configuration';
import { DefaultJobDispatcher } from '../dispatcher/default-job-dispatcher';
import { InMemoryHandlerRegistry } from '../handlers/in-memory-handler-registry';
import { DefaultWorkerRuntime } from './default-worker-runtime';

export interface DefaultWorkerFactoryDependencies {
  readonly configuration: WorkerConfiguration;
  readonly handlerRegistry: InMemoryHandlerRegistry;
}

export class DefaultWorkerFactory {
  private readonly configuration: WorkerConfiguration;
  private readonly handlerRegistry: InMemoryHandlerRegistry;

  public constructor(dependencies: DefaultWorkerFactoryDependencies) {
    this.configuration = dependencies.configuration;
    this.handlerRegistry = dependencies.handlerRegistry;
  }

  public async create(kind: string): Promise<DefaultWorkerRuntime> {
    const dispatcher = new DefaultJobDispatcher({ handlerRegistry: this.handlerRegistry });
    const runtime = new DefaultWorkerRuntime({
      dispatcher,
      configuration: { ...this.configuration, kind, queueName: this.configuration.queueName || kind },
    });
    await runtime.start();
    return runtime;
  }
}
