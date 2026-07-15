export type RecoveryAction =
  | 'resume-from-checkpoint'
  | 'restart-synchronization'
  | 'restart-download'
  | 'restart-import'
  | 'rollback-state'
  | 'pause-synchronization'
  | 'permanent-failure'
  | 'manual-intervention'
  | 'custom'
  | 'none';

export type RecoveryPolicyId =
  | 'resume-from-checkpoint'
  | 'restart-synchronization'
  | 'restart-download'
  | 'restart-import'
  | 'rollback-state'
  | 'pause-synchronization'
  | 'permanent-failure'
  | 'manual-intervention'
  | 'custom'
  | 'none';

export type RetryPolicyId =
  | 'none'
  | 'immediate'
  | 'fixed-delay'
  | 'linear-backoff'
  | 'exponential-backoff'
  | 'exponential-backoff-with-jitter'
  | 'adaptive'
  | 'custom';

export type FailureClassificationKind =
  | 'transient'
  | 'permanent'
  | 'infrastructure'
  | 'provider'
  | 'repository'
  | 'synchronization'
  | 'validation'
  | 'timeout'
  | 'unexpected'
  | 'unknown';

export interface FailureClassification {
  readonly kind: FailureClassificationKind;
  readonly category: FailureClassificationKind;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly retryable: boolean;
  readonly recoveryEligible: boolean;
  readonly confidence: number;
  readonly reason: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RetryDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly delayMs: number;
  readonly nextAttemptAt: number;
  readonly recoveryRecommendation: RecoveryAction | string;
  readonly confidence: number;
  readonly policyId: RetryPolicyId;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RecoveryPlan {
  readonly recoveryAction: RecoveryAction;
  readonly checkpointReference?: string | undefined;
  readonly retryPolicy: RetryPolicyId;
  readonly recoveryPolicy: RecoveryPolicyId;
  readonly failureClassification: FailureClassification;
  readonly retryDecision: RetryDecision;
  readonly recoveryMetadata: Readonly<Record<string, unknown>>;
  readonly warnings: readonly string[];
  readonly statistics: Readonly<Record<string, number | string | boolean | undefined>>;
  readonly createdAt: number;
}

export interface FailureHistoryEntry {
  readonly occurredAt: number;
  readonly classification: FailureClassificationKind;
  readonly retryCount: number;
  readonly failureCount: number;
  readonly consecutiveFailures: number;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface FailureHistory {
  readonly retryCount: number;
  readonly failureCount: number;
  readonly consecutiveFailures: number;
  readonly lastFailure?: FailureHistoryEntry | undefined;
  readonly failureTimeline: readonly FailureHistoryEntry[];
  readonly lastSuccessfulRecovery?: number | undefined;
  readonly recoveryHistoryMetadata: Readonly<Record<string, unknown>>;
}

export interface CircuitProtectionState {
  readonly enabled: boolean;
  readonly failureThreshold?: number | undefined;
  readonly cooldownWindowMs?: number | undefined;
  readonly halfOpen: boolean;
  readonly failureRate?: number | undefined;
  readonly lastOpenedAt?: number | undefined;
}
