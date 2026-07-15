import type { FeedLease, FeedLeaseRequest, FeedLeaseValidationRequest } from '../types/locking';
import type { FeedLeaseManagerLike } from '../interfaces/locking';
import type { FeedLock, FeedLockWarning } from '../types/locking';
import { LeaseExpiredError, LeaseMismatchError, LockStateError } from '../errors/locking';

export class FeedLeaseManager implements FeedLeaseManagerLike {
  private readonly leases = new Map<string, FeedLease>();

  public createLease(request: FeedLeaseRequest): FeedLease {
    const now = Date.now();
    const expiration = request.expiration ?? now + 1000 * 60;
    const lease: FeedLease = {
      id: `lease:${request.owner}:${now}`,
      owner: request.owner,
      startTime: request.startTime ?? now,
      expiration,
      renewalCount: 0,
      version: request.version ?? 1,
      metadata: Object.freeze({ ...(request.metadata ?? {}) }),
      ...(request.lockId ? { lockId: request.lockId } : {}),
      state: 'Active',
    } as FeedLease;
    this.leases.set(lease.id, lease);
    return Object.freeze(lease) as FeedLease;
  }

  public createLeaseFromLock(
    lock: FeedLock,
    request: {
      owner: string;
      correlationId?: string;
      ttlMs?: number;
      metadata?: Record<string, unknown>;
    },
  ): FeedLease {
    return this.createLease({
      owner: request.owner,
      lockId: lock.id,
      expiration: Date.now() + (request.ttlMs ?? 1000 * 60),
      metadata: {
        ...(request.metadata ?? {}),
        correlationId: request.correlationId,
        feedId: lock.feedId,
        lockVersion: lock.version,
      },
    });
  }

  public renewLease(
    lease: FeedLease,
    request: { owner: string; ttlMs?: number; metadata?: Record<string, unknown> },
  ): FeedLease {
    if (lease.owner !== request.owner) {
      throw new LeaseMismatchError('Lease owner does not match the requested renewal owner.', {
        owner: request.owner,
        ...(lease.lockId ? { lockId: lease.lockId } : {}),
        stage: 'renew',
      });
    }
    const renewed: FeedLease = {
      ...lease,
      expiration: Date.now() + (request.ttlMs ?? 1000 * 60),
      renewalCount: lease.renewalCount + 1,
      version: lease.version + 1,
      metadata: Object.freeze({ ...lease.metadata, ...(request.metadata ?? {}) }),
    };
    this.leases.set(renewed.id, renewed);
    return Object.freeze(renewed) as FeedLease;
  }

  public releaseLease(lease: FeedLease): FeedLease {
    const released: FeedLease = { ...lease, state: 'Released' };
    this.leases.set(released.id, released);
    return Object.freeze(released) as FeedLease;
  }

  public expireLease(lease: FeedLease, now = Date.now()): FeedLease {
    const expired: FeedLease = {
      ...lease,
      state: now >= lease.expiration ? 'Expired' : lease.state,
    };
    this.leases.set(expired.id, expired);
    return Object.freeze(expired) as FeedLease;
  }

  public async validateLease(
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
  }> {
    const resolved = typeof lease === 'string' ? this.getLease(lease) : lease;
    if (!resolved) {
      return {
        valid: false,
        warnings: [],
        conflict: {
          code: 'lease-missing',
          message: 'Requested lease does not exist.',
          stage: 'lease',
          resolution: 'Create a lease before authorizing execution.',
          details: { leaseId: typeof lease === 'string' ? lease : undefined },
        },
      };
    }
    const now = request.now ?? Date.now();
    if (resolved.state === 'Expired' || now >= resolved.expiration) {
      return {
        valid: false,
        warnings: [],
        conflict: {
          code: 'lease-expired',
          message: 'Lease has expired.',
          stage: 'lease',
          resolution: 'Recover the lease or request a fresh one before execution.',
          details: { leaseId: resolved.id, owner: resolved.owner, expiration: resolved.expiration },
        },
      };
    }
    if (request.owner && resolved.owner !== request.owner) {
      return {
        valid: false,
        warnings: [],
        conflict: {
          code: 'lease-mismatch',
          message: 'Lease owner mismatch.',
          stage: 'lease',
          resolution: 'Validate the owner identity before proceeding.',
          details: { leaseId: resolved.id, owner: resolved.owner },
        },
      };
    }
    const warnings: FeedLockWarning[] = [];
    if (resolved.renewalCount >= 3) {
      warnings.push({
        code: 'lease-renewal-heavy',
        message: 'Lease has been renewed repeatedly.',
        stage: 'lease',
        severity: 'warning',
        ...(resolved.lockId ? { lockId: resolved.lockId } : {}),
        owner: resolved.owner,
      });
    }
    return { valid: true, lease: resolved, warnings };
  }

  public getLease(leaseId: string): FeedLease | undefined {
    return this.leases.get(leaseId);
  }

  public getLeases(): readonly FeedLease[] {
    return Array.from(this.leases.values());
  }
}
