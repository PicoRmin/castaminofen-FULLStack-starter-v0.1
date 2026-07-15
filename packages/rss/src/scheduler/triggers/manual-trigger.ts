import { BaseTrigger } from './base-trigger';

export class ManualTrigger<TPayload = unknown> extends BaseTrigger<TPayload> {
  public override readonly id: string;
  public override readonly name: string;
  public override readonly feedId: string;
  public override readonly kind = 'manual' as const;
  public override payload: TPayload | undefined;

  public constructor(params: {
    readonly id: string;
    readonly name: string;
    readonly feedId: string;
    readonly correlationId?: string;
    readonly policyId?: string;
    readonly priority?: number;
    readonly payload?: TPayload;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly createdAt?: number;
    readonly nextRunAt?: number;
    readonly scheduleName?: string;
    readonly configuration?: Readonly<Record<string, unknown>>;
  }) {
    super(params);
    this.id = params.id;
    this.name = params.name;
    this.feedId = params.feedId;
    this.payload = params.payload;
  }
}
