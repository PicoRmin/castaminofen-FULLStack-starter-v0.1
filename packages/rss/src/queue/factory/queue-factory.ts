import { QueueAdapterError } from '../errors/queue-errors';
import type { QueueAdapter } from '../interfaces/queue-adapter';
import type { QueueRegistry } from '../registry/queue-registry';
import type { QueueDefinition } from '../types/queue-definition';

export interface QueueFactoryDependencies {
  readonly registry: QueueRegistry;
  readonly adapter: QueueAdapter<QueueDefinition>;
}

export class QueueFactory {
  private readonly registry: QueueRegistry;
  private readonly adapter: QueueAdapter<QueueDefinition>;
  private readonly cache = new Map<string, QueueDefinition>();

  public constructor(dependencies: QueueFactoryDependencies) {
    this.registry = dependencies.registry;
    this.adapter = dependencies.adapter;
  }

  public async createQueue(name: string): Promise<QueueDefinition> {
    const cached = this.cache.get(name);
    if (cached) {
      return cached;
    }

    const definition = this.registry.resolve(name);
    if (!definition) {
      throw new QueueAdapterError(`Queue not registered: ${name}`, { queueName: name });
    }

    const created = await this.adapter.createQueue(definition);
    this.cache.set(name, created);
    return created;
  }

  public getQueue(name: string): QueueDefinition | undefined {
    return this.cache.get(name);
  }
}
