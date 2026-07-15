import type { WorkerLifecycleHooks } from '../events/worker-events';
import type { WorkerConfiguration, WorkerLifecycleState } from '../contracts/worker-configuration';

export interface WorkerLifecycleDependencies {
  readonly configuration: WorkerConfiguration;
  readonly hooks?: WorkerLifecycleHooks;
}

export class WorkerLifecycle {
  private readonly configuration: WorkerConfiguration;
  private readonly hooks: WorkerLifecycleHooks | undefined;
  private state: WorkerLifecycleState = 'idle';

  public constructor(dependencies: WorkerLifecycleDependencies) {
    this.configuration = dependencies.configuration;
    this.hooks = dependencies.hooks;
  }

  public get currentState(): WorkerLifecycleState {
    return this.state;
  }

  public async start(): Promise<void> {
    this.state = 'starting';
    await this.hooks?.onWorkerStarted?.({ type: 'worker-started', stage: 'startup', message: 'Worker started', context: { workerId: this.configuration.workerId }, timestamp: Date.now() });
    this.state = 'ready';
    await this.hooks?.onWorkerReady?.({ type: 'worker-ready', stage: 'startup', message: 'Worker ready', context: { workerId: this.configuration.workerId }, timestamp: Date.now() });
  }

  public async stop(): Promise<void> {
    this.state = 'stopping';
    await this.hooks?.onWorkerStopped?.({ type: 'worker-stopped', stage: 'shutdown', message: 'Worker stopped', context: { workerId: this.configuration.workerId }, timestamp: Date.now() });
    this.state = 'stopped';
  }
}
