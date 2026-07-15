import type { QueueConfiguration } from '../configuration/queue-configuration';
import type { QueueJobKind } from './queue-types';

export interface QueueDefinition {
  readonly name: string;
  readonly kind: QueueJobKind;
  readonly description: string;
  readonly config: QueueConfiguration;
}
