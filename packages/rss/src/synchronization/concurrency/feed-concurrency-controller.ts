import type {
  FeedLockExecutionDecision,
  FeedLockExecutionRequest,
  FeedLockWarning,
} from '../types/locking';
import type {
  FeedConcurrencyControllerDependencies,
  FeedConcurrencyControllerLike,
} from '../interfaces/locking';
import type { FeedLease } from '../types/locking';
import {
  ConcurrencyConflictError,
  LeaseExpiredError,
  OwnershipValidationError,
} from '../errors/locking';

export class FeedConcurrencyController implements FeedConcurrencyControllerLike {
  public constructor(private readonly dependencies: FeedConcurrencyControllerDependencies) {}

  public async authorizeExecution(
    request: FeedLockExecutionRequest,
  ): Promise<FeedLockExecutionDecision> {
    const lock = request.lock;
    const warnings: FeedLockWarning[] = [];
    const stage = 'ownership-validation';

    if (!lock) {
      return {
        allowed: false,
        warnings,
        stage,
        ...(request.feedId
          ? {
              conflict: {
                code: 'lock-missing',
                message: 'A lock is required before execution can proceed.',
                stage,
                resolution: 'Acquire a lock before running the operation.',
                details: { feedId: request.feedId },
              },
            }
          : {}),
      };
    }

    if (lock.state !== 'Acquired') {
      return {
        allowed: false,
        warnings,
        stage,
        conflict: {
          code: 'lock-state-invalid',
          message: 'The requested lock is not in an acquired state.',
          stage,
          resolution: 'Recover or reacquire the lock before continuing.',
          details: { lockId: lock.id, feedId: lock.feedId, state: lock.state },
        },
      };
    }

    if (lock.ownerId !== request.ownerId) {
      return {
        allowed: false,
        warnings,
        stage,
        conflict: {
          code: 'ownership-conflict',
          message: 'Lock ownership does not match the caller.',
          stage,
          resolution: 'Use the lock owner identity when authorizing execution.',
          details: { lockId: lock.id, feedId: lock.feedId, ownerId: request.ownerId },
        },
      };
    }

    const lease = request.lease;
    if (lease) {
      const validation = await this.dependencies.leaseManager.validateLease(lease, {
        owner: request.ownerId,
        now: Date.now(),
        lockId: lock.id,
      });
      if (!validation.valid) {
        return {
          allowed: false,
          warnings,
          stage: 'lease-validation',
          ...(validation.conflict ? { conflict: validation.conflict } : {}),
          warnings: validation.warnings,
        } as FeedLockExecutionDecision;
      }
      warnings.push(...validation.warnings);
    }

    if (request.feedId && lock.feedId !== request.feedId) {
      return {
        allowed: false,
        warnings,
        stage,
        conflict: {
          code: 'feed-mismatch',
          message: 'The requested feed does not match the lock target.',
          stage,
          resolution: 'Validate the feed identity before execution.',
          details: { feedId: request.feedId, lockFeedId: lock.feedId },
        },
      };
    }

    if (request.ttlMs && request.ttlMs > lock.expiresAt - Date.now()) {
      warnings.push({
        code: 'expiring-lease',
        message: 'The lock is close to expiration.',
        stage: 'lease',
        severity: 'warning',
        lockId: lock.id,
        feedId: lock.feedId,
        owner: lock.ownerId,
      });
    }

    await this.dependencies.hooks?.onOwnershipValidated?.({
      type: 'ownership-validated',
      stage,
      message: 'Ownership validated',
      context: { feedId: lock.feedId, ownerId: request.ownerId },
      timestamp: Date.now(),
    });
    return {
      allowed: true,
      lock,
      ...(lease ? { lease } : {}),
      warnings,
      stage: 'authorization-approved',
    };
  }
}
