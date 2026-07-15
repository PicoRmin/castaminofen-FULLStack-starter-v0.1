export interface RateLimiterConfig {
  readonly windowMs: number;
  readonly maxRequests: number;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, number[]>();

  constructor(private readonly config: RateLimiterConfig) {}

  allow(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const entries = this.buckets.get(key) ?? [];
    const recent = entries.filter((timestamp) => timestamp > windowStart);

    if (recent.length >= this.config.maxRequests) {
      this.buckets.set(key, recent);
      return false;
    }

    recent.push(now);
    this.buckets.set(key, recent);
    return true;
  }
}
