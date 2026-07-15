export type FeedLockState =
  | 'Available'
  | 'Pending'
  | 'Acquired'
  | 'Renewing'
  | 'Expired'
  | 'Released'
  | 'Failed'
  | 'Cancelled';
export type FeedLockStrategy =
  | 'single-feed'
  | 'global'
  | 'read'
  | 'write'
  | 'optimistic'
  | 'pessimistic'
  | 'custom'
  | (string & {});

export interface FeedLockTransitionRecord {
  readonly fromState: FeedLockState;
  readonly toState: FeedLockState;
  readonly changedAt: number;
  readonly reason?: string;
  readonly ownerId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface FeedLock {
  readonly id: string;
  readonly feedId: string;
  readonly ownerId: string;
  readonly correlationId?: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly leaseId: string;
  readonly version: number;
  readonly state: FeedLockState;
  readonly strategy: FeedLockStrategy;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly history: readonly FeedLockTransitionRecord[];
  readonly lastUpdatedAt: number;
}

export interface FeedLease {
  readonly id: string;
  readonly owner: string;
  readonly startTime: number;
  readonly expiration: number;
  readonly renewalCount: number;
  readonly version: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly lockId?: string;
  readonly state: 'Active' | 'Expired' | 'Released' | 'Invalidated' | 'Failed';
}

export interface FeedLockPolicy {
  readonly strategy: FeedLockStrategy;
  readonly ttlMs: number;
  readonly allowSteal?: boolean;
  readonly maxRenewals?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLockRequest {
  readonly feedId: string;
  readonly ownerId: string;
  readonly correlationId?: string;
  readonly policy: FeedLockPolicy;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLockRenewRequest {
  readonly ownerId: string;
  readonly ttlMs?: number;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLockReleaseRequest {
  readonly ownerId: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLockRecoveryRequest {
  readonly ownerId?: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLockInvalidationRequest {
  readonly ownerId?: string;
  readonly reason?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLeaseRequest {
  readonly owner: string;
  readonly lockId?: string;
  readonly startTime?: number;
  readonly expiration?: number;
  readonly version?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLeaseValidationRequest {
  readonly owner?: string;
  readonly now?: number;
  readonly lockId?: string;
}

export interface FeedLockConflict {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly lockId?: string;
  readonly feedId?: string;
  readonly owner?: string;
  readonly resolution: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface FeedLockWarning {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly severity: 'warning' | 'info';
  readonly lockId?: string;
  readonly feedId?: string;
  readonly owner?: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface FeedLockExecutionRequest {
  readonly lock?: FeedLock;
  readonly lease?: FeedLease;
  readonly feedId?: string;
  readonly ownerId: string;
  readonly correlationId?: string;
  readonly strategyId?: string;
  readonly ttlMs?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLockExecutionDecision {
  readonly allowed: boolean;
  readonly lock?: FeedLock;
  readonly lease?: FeedLease;
  readonly conflict?: FeedLockConflict;
  readonly warnings: readonly FeedLockWarning[];
  readonly stage: string;
}
