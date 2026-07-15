import type { SchedulerTriggerContract } from '../contracts/scheduler-trigger-contract';
import { ScheduleConflictError } from '../errors/scheduler-errors';

export class SchedulerRegistry {
  private readonly triggers = new Map<string, SchedulerTriggerContract>();

  public register(trigger: SchedulerTriggerContract): SchedulerTriggerContract {
    if (this.triggers.has(trigger.id)) {
      throw new ScheduleConflictError(`Trigger already registered: ${trigger.id}`, { triggerId: trigger.id, executionStage: 'registration' });
    }

    this.triggers.set(trigger.id, trigger);
    return trigger;
  }

  public get(triggerId: string): SchedulerTriggerContract | undefined {
    return this.triggers.get(triggerId);
  }

  public all(): readonly SchedulerTriggerContract[] {
    return Array.from(this.triggers.values());
  }
}
