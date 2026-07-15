import { randomUUID } from 'node:crypto';

export interface RetryDecision {
  readonly shouldRetry: boolean;
  readonly shouldDeadLetter: boolean;
  readonly delayMs: number;
  readonly reason: string;
}

export interface RetryContext {
  readonly attemptsMade: number;
  readonly maxAttempts: number;
  readonly error: unknown;
}

export function resolveRetryDecision({
  attemptsMade,
  maxAttempts,
  error,
}: RetryContext): RetryDecision {
  const isTransient = isTransientFailure(error);
  const remainingAttempts = Math.max(0, maxAttempts - attemptsMade);

  if (isTransient && remainingAttempts > 0) {
    const delayMs = Math.min(1000 * (attemptsMade + 1), 10000);
    return {
      shouldRetry: true,
      shouldDeadLetter: false,
      delayMs,
      reason: 'خطای موقت؛ تلاش دوباره انجام می‌شود',
    };
  }

  return {
    shouldRetry: false,
    shouldDeadLetter: true,
    delayMs: 0,
    reason: 'خطای دائم یا تلاش‌های مجاز پایان یافته‌اند',
  };
}

export function buildJobId(prefix = 'job'): string {
  return `${prefix}-${randomUUID()}`;
}

function isTransientFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return /timeout|tempor|network|redis|connection|busy|rate limit|throttle|temporarily/i.test(
    message,
  );
}
