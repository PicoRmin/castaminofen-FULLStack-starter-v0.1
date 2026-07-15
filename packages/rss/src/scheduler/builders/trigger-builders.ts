import { CronTrigger } from '../triggers/cron-trigger';
import { ManualTrigger } from '../triggers/manual-trigger';
import { OneTimeTrigger } from '../triggers/one-time-trigger';
import { RecurringTrigger } from '../triggers/recurring-trigger';
import { IntervalTrigger } from '../triggers/interval-trigger';

export class TriggerBuilder {
  public static createManual(params: ConstructorParameters<typeof ManualTrigger>[0]) {
    return new ManualTrigger(params);
  }

  public static createCron(params: ConstructorParameters<typeof CronTrigger>[0]) {
    return new CronTrigger(params);
  }

  public static createOneTime(params: ConstructorParameters<typeof OneTimeTrigger>[0]) {
    return new OneTimeTrigger(params);
  }

  public static createRecurring(params: ConstructorParameters<typeof RecurringTrigger>[0]) {
    return new RecurringTrigger(params);
  }

  public static createInterval(params: ConstructorParameters<typeof IntervalTrigger>[0]) {
    return new IntervalTrigger(params);
  }
}
