import type { WorkerHandler } from '../contracts/worker-handler-contract';

export interface RegisteredHandler {
  readonly kind: string;
  readonly handler: WorkerHandler;
}

export class InMemoryHandlerRegistry {
  private readonly handlers = new Map<string, WorkerHandler>();

  public register(kind: string, handler: WorkerHandler): void {
    this.handlers.set(kind, handler);
  }

  public get(kind: string): WorkerHandler | undefined {
    return this.handlers.get(kind);
  }

  public has(kind: string): boolean {
    return this.handlers.has(kind);
  }

  public entries(): readonly RegisteredHandler[] {
    return Array.from(this.handlers.entries()).map(([kind, handler]) => ({ kind, handler }));
  }
}
