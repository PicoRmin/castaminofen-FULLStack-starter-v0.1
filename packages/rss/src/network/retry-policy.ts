import type { RetryPolicy } from './types';

export class DefaultRetryPolicy implements RetryPolicy {
  public readonly maxRetries: number;
  public readonly backoffStrategy: RetryPolicy['backoffStrategy'];
  public readonly backoffMs: number;
  public readonly jitterMs: number;
  public readonly retryableStatusCodes: number[];
  public readonly retryableMethods: string[];

  public constructor(overrides: Partial<RetryPolicy> = {}) {
    this.maxRetries = overrides.maxRetries ?? 2;
    this.backoffStrategy = overrides.backoffStrategy ?? 'exponential';
    this.backoffMs = overrides.backoffMs ?? 200;
    this.jitterMs = overrides.jitterMs ?? 50;
    this.retryableStatusCodes = overrides.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504];
    this.retryableMethods = overrides.retryableMethods ?? ['GET', 'HEAD'];
  }

  public shouldRetry(statusCode: number, method: string, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false;
    }

    if (!this.retryableMethods.includes(method.toUpperCase())) {
      return false;
    }

    return this.retryableStatusCodes.includes(statusCode);
  }

  public computeDelay(attempt: number): number {
    const base = this.backoffStrategy === 'linear' ? this.backoffMs * attempt : this.backoffMs * 2 ** attempt;
    const jitter = Math.floor(Math.random() * this.jitterMs);
    return Math.max(0, base + jitter);
  }
}
