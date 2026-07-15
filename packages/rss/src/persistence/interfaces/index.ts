import type { PersistenceEvent } from '../events';

export type PersistenceEventListener = (event: PersistenceEvent) => void | Promise<void>;
