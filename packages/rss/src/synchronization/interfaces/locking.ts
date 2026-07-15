import type {
  FeedLease,
  FeedLeaseRequest,
  FeedLeaseValidationRequest,
  FeedLock,
  FeedLockExecutionDecision,
  FeedLockExecutionRequest,
  FeedLockInvalidationRequest,
  FeedLockPolicy,
  FeedLockRecoveryRequest,
  FeedLockReleaseRequest,
  FeedLockRenewRequest,
  FeedLockRequest,
  FeedLockWarning,
} from '../types/locking';
import type { FeedLockLifecycleHooks } from '../events/locking';

export interface FeedLockManagerLike {
  acquireLock(request: FeedLockRequest): Promise<FeedLock>;
  renewLock(lock: FeedLock, request: FeedLockRenewRequest): Promise<FeedLock>;
  releaseLock(lock: FeedLock, request: FeedLockReleaseRequest): Promise<FeedLock>;
  expireLock(lock: FeedLock, now?: number): Promise<FeedLock>;
  recoverLock(lock: FeedLock, request: FeedLockRecoveryRequest): Promise<FeedLock>;
  invalidateLock(lock: FeedLock, request?: FeedLockInvalidationRequest): Promise<FeedLock>;
  getLock(feedId: string): Promise<FeedLock | undefined>;
  getLocks(): Promise<readonly FeedLock[]>;
  getHistory(feedId: string): Promise<readonly FeedLock[]>;
}

export interface FeedLeaseManagerLike {
  createLease(request: FeedLeaseRequest): FeedLease;
  createLeaseFromLock(
    lock: FeedLock,
    request: {
      owner: string;
      correlationId?: string;
      ttlMs?: number;
      metadata?: Record<string, unknown>;
    },
  ): FeedLease;
  renewLease(
    lease: FeedLease,
    request: { owner: string; ttlMs?: number; metadata?: Record<string, unknown> },
  ): FeedLease;
  releaseLease(lease: FeedLease): FeedLease;
  expireLease(lease: FeedLease, now?: number): FeedLease;
  validateLease(
    lease: FeedLease | string,
    request: FeedLeaseValidationRequest,
  ): Promise<{
    valid: boolean;
    lease?: FeedLease;
    warnings: readonly FeedLockWarning[];
    conflict?: {
      code: string;
      message: string;
      stage: string;
      resolution: string;
      details?: Readonly<Record<string, unknown>>;
    };
  }>;
  getLease(leaseId: string): FeedLease | undefined;
  getLeases(): readonly FeedLease[];
}

export interface FeedConcurrencyControllerDependencies {
  readonly lockManager: FeedLockManagerLike;
  readonly leaseManager: FeedLeaseManagerLike;
  readonly hooks?: FeedLockLifecycleHooks;
}

export interface FeedConcurrencyControllerLike {
  authorizeExecution(request: FeedLockExecutionRequest): Promise<FeedLockExecutionDecision>;
}
