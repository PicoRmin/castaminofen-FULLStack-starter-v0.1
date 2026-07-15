import { QueueConfigurationError, QueueError } from '../errors/queue-errors';
import type { QueueDefinition } from '../types/queue-definition';

export class QueueRegistry {
  private readonly definitions = new Map<string, QueueDefinition>();

  public register(definition: QueueDefinition): QueueDefinition {
    this.assertDefinition(definition);
    if (this.definitions.has(definition.name)) {
      throw new QueueError(`Queue already registered: ${definition.name}`, { queueName: definition.name });
    }

    this.definitions.set(definition.name, definition);
    return definition;
  }

  public resolve(name: string): QueueDefinition | undefined {
    return this.definitions.get(name);
  }

  public getAll(): readonly QueueDefinition[] {
    return Array.from(this.definitions.values());
  }

  public has(name: string): boolean {
    return this.definitions.has(name);
  }

  private assertDefinition(definition: QueueDefinition): void {
    if (!definition?.name?.trim()) {
      throw new QueueConfigurationError('Queue definitions require a non-empty name.', { definition });
    }

    if (!definition.config?.queueName?.trim()) {
      throw new QueueConfigurationError('Queue definitions require a queueName.', { definition });
    }
  }
}
