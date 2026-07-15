import type {
  FeedLock,
  FeedLockPolicy,
  FeedLockRecoveryRequest,
  FeedLockReleaseRequest,
  FeedLockRenewRequest,
  FeedLockRequest,
  FeedLockInvalidationRequest,
  FeedLockTransitionRecord,
} from '../types/locking';
import type { FeedLockManagerLike } from '../interfaces/locking';
import {
  LockAcquisitionError,
  LockStateError,
  OwnershipValidationError,
  ConcurrencyConflictError,
} from '../errors/locking';

export class FeedLockManager implements FeedLockManagerLike {
  private readonly locks = new Map<string, FeedLock>();
  private readonly history = new Map<string, FeedLock[]>();

  public async acquireLock(request: FeedLockRequest): Promise<FeedLock> {
    const existing = this.locks.get(request.feedId);
    if (existing && existing.state === 'Acquired' && existing.ownerId === request.ownerId) {
      return existing;
    }
    if (existing && existing.state === 'Acquired' && request.policy.allowSteal !== true) {
      throw new LockAcquisitionError('A feed lock is already held for this feed.', {
        lockId: existing.id,
        feedId: request.feedId,
        owner: existing.ownerId,
        stage: 'acquire',
      });
    }
    const now = Date.now();
    const lock: FeedLock = Object.freeze({
      id: `lock:${request.feedId}:${now}`,
      feedId: request.feedId,
      ownerId: request.ownerId,
      correlationId: request.correlationId,
      createdAt: now,
      expiresAt: now + request.policy.ttlMs,
      leaseId: `lease:${request.ownerId}:${now}`,
      version: 1,
      state: 'Acquired',
      strategy: request.policy.strategy,
      metadata: Object.freeze({
        ...(request.metadata ?? {}),
        policy: { ...request.policy },
        acquiredAt: now,
      }),
      history: [
        this.transition(
          'Available',
          'Acquired',
          now,
          'lock-created',
          request.ownerId,
          request.metadata,
        ),
      ],
      lastUpdatedAt: now,
    }) as FeedLock;
    this.locks.set(request.feedId, lock);
    this.history.set(request.feedId, [lock]);
    return lock;
  }

  public async renewLock(lock: FeedLock, request: FeedLockRenewRequest): Promise<FeedLock> {
    this.assertOwned(lock, request.ownerId, 'renew');
    if (
      lock.state === 'Expired' ||
      lock.state === 'Released' ||
      lock.state === 'Failed' ||
      lock.state === 'Cancelled'
    ) {
      throw new LockStateError('Cannot renew a lock that is not active.', {
        lockId: lock.id,
        feedId: lock.feedId,
        owner: lock.ownerId,
        stage: 'renew',
      });
    }
    const now = Date.now();
    const renewed: FeedLock = Object.freeze({
      ...lock,
      expiresAt: now + (request.ttlMs ?? (lock.metadata.policy as { ttlMs?: number } | undefined)?.ttlMs ?? 60_000),
      version: lock.version + 1,
      state: 'Acquired',
      metadata: Object.freeze({
        ...lock.metadata,
        ...(request.metadata ?? {}),
        renewalCount: (lock.metadata.renewalCount as number | undefined) ?? 0 + 1,
        renewedAt: now,
      }),
      history: [
        ...lock.history,
        this.transition(
          lock.state,
          'Acquired',
          now,
          'lock-renewed',
          request.ownerId,
          request.metadata,
        ),
      ],
      lastUpdatedAt: now,
    }) as FeedLock;
    this.locks.set(lock.feedId, renewed);
    return renewed;
  }

  public async releaseLock(lock: FeedLock, request: FeedLockReleaseRequest): Promise<FeedLock> {
    this.assertOwned(lock, request.ownerId, 'release');
    const released: FeedLock = Object.freeze({
      ...lock,
      state: 'Released',
      metadata: Object.freeze({ ...lock.metadata, releasedAt: Date.now() }),
      history: [
        ...lock.history,
        this.transition(
          lock.state,
          'Released',
          Date.now(),
          'lock-released',
          request.ownerId,
          request.metadata,
        ),
      ],
      lastUpdatedAt: Date.now(),
    }) as FeedLock;
    this.locks.set(lock.feedId, released);
    return released;
  }

  public async expireLock(lock: FeedLock, now = Date.now()): Promise<FeedLock> {
    if (lock.state === 'Released' || lock.state === 'Failed' || lock.state === 'Cancelled') {
      return lock;
    }
    const expired: FeedLock = Object.freeze({
      ...lock,
      state: now >= lock.expiresAt ? 'Expired' : lock.state,
      metadata: Object.freeze({ ...lock.metadata, expiredAt: now }),
      history: [
        ...lock.history,
        this.transition(
          lock.state,
          now >= lock.expiresAt ? 'Expired' : lock.state,
          now,
          'lock-expired',
          lock.ownerId,
          { expiredAt: now },
        ),
      ],
      lastUpdatedAt: now,
    }) as FeedLock;
    this.locks.set(lock.feedId, expired);
    return expired;
  }

  public async recoverLock(lock: FeedLock, request: FeedLockRecoveryRequest): Promise<FeedLock> {
    const recovered: FeedLock = Object.freeze({
      ...lock,
      state: 'Acquired',
      metadata: Object.freeze({
        ...lock.metadata,
        recoveredAt: Date.now(),
        recoveryRequestedBy: request.ownerId ?? lock.ownerId,
        recoveryCorrelationId: request.correlationId,
      }),
      history: [
        ...lock.history,
        this.transition(
          lock.state,
          'Acquired',
          Date.now(),
          'lock-recovered',
          request.ownerId ?? lock.ownerId,
          request.metadata,
        ),
      ],
      lastUpdatedAt: Date.now(),
    }) as FeedLock;
    this.locks.set(lock.feedId, recovered);
    return recovered;
  }

  public async invalidateLock(
    lock: FeedLock,
    request?: FeedLockInvalidationRequest,
  ): Promise<FeedLock> {
    const invalidated: FeedLock = Object.freeze({
      ...lock,
      state: 'Failed',
      metadata: Object.freeze({
        ...lock.metadata,
        invalidatedAt: Date.now(),
        invalidationReason: request?.reason,
      }),
      history: [
        ...lock.history,
        this.transition(
          lock.state,
          'Failed',
          Date.now(),
          'lock-invalidated',
          request?.ownerId ?? lock.ownerId,
          request?.metadata,
        ),
      ],
      lastUpdatedAt: Date.now(),
    }) as FeedLock;
    this.locks.set(lock.feedId, invalidated);
    return invalidated;
  }

  public async getLock(feedId: string): Promise<FeedLock | undefined> {
    return this.locks.get(feedId);
  }

  public async getLocks(): Promise<readonly FeedLock[]> {
    return Array.from(this.locks.values());
  }

  public async getHistory(feedId: string): Promise<readonly FeedLock[]> {
    return this.history.get(feedId) ?? [];
  }

  private assertOwned(lock: FeedLock, ownerId: string, stage: string): void {
    if (lock.ownerId !== ownerId) {
      throw new OwnershipValidationError('The current owner does not match the requested owner.', {
        lockId: lock.id,
        feedId: lock.feedId,
        owner: ownerId,
        stage,
      });
    }
  }

  private transition(
    fromState: FeedLockState,
    toState: FeedLockState,
    changedAt: number,
    reason: string,
    ownerId?: string,
    metadata?: Record<string, unknown>,
  ): FeedLockTransitionRecord {
    return {
      fromState,
      toState,
      changedAt,
      reason,
      ...(ownerId !== undefined ? { ownerId } : {}),
      ...(metadata !== undefined ? { metadata: Object.freeze({ ...metadata }) } : {}),
    };
  }
}

export type FeedLockState =
  | 'Available'
  | 'Pending'
  | 'Acquired'
  | 'Renewing'
  | 'Expired'
  | 'Released'
  | 'Failed'
  | 'Cancelled';
