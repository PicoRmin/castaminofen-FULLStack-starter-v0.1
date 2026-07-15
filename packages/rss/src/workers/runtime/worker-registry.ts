import type { WorkerRegistration } from '../types/worker-types';
import type { WorkerRuntime } from '../contracts/worker-runtime-contract';

export class WorkerRegistry {
  private readonly registrations = new Map<string, WorkerRegistration>();
  private readonly runtimes = new Map<string, WorkerRuntime>();

  public register(registration: WorkerRegistration): void {
    this.registrations.set(registration.kind, registration);
  }

  public async create(kind: string): Promise<WorkerRuntime | undefined> {
    const registration = this.registrations.get(kind);
    if (!registration) {
      return undefined;
    }
    if (!this.runtimes.has(kind)) {
      const runtime = await registration.runtimeFactory();
      this.runtimes.set(kind, runtime as WorkerRuntime);
    }
    return this.runtimes.get(kind);
  }

  public get(kind: string): WorkerRuntime | undefined {
    return this.runtimes.get(kind);
  }

  public entries(): readonly WorkerRegistration[] {
    return Array.from(this.registrations.values());
  }
}
