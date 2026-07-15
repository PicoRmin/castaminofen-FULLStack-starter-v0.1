import type { FailureClassification, FailureClassificationKind } from '../types';
import { FailureClassificationError } from '../errors';

export class FailureClassifier {
  public classify(error: unknown, context: Record<string, unknown> = {}): FailureClassification {
    if (typeof error === 'string') {
      return this.fromText(error, context);
    }
    if (error instanceof Error) {
      return this.fromText(error.message, context);
    }
    if (error && typeof error === 'object') {
      const candidate = error as Record<string, unknown>;
      const maybe = typeof candidate.message === 'string' ? candidate.message : undefined;
      if (maybe) {
        return this.fromText(maybe, context);
      }
    }
    throw new FailureClassificationError('Unable to classify the supplied failure.', {
      errorCode: 'failure-classification-error',
      context,
      recoveryRecommendation:
        'Inspect the error payload and pass a serializable error object or message.',
    });
  }

  private fromText(message: string, context: Record<string, unknown>): FailureClassification {
    const normalized = message.toLowerCase();
    const kind = this.detectKind(normalized, context);
    const retryable = this.isRetryable(kind);
    const recoveryEligible =
      kind !== 'permanent' && kind !== 'validation' && kind !== 'unexpected' && kind !== 'unknown';
    const severity =
      kind === 'unexpected'
        ? 'critical'
        : kind === 'validation' || kind === 'permanent'
          ? 'error'
          : kind === 'timeout'
            ? 'warning'
            : 'error';
    return Object.freeze({
      kind,
      category: kind,
      severity,
      retryable,
      recoveryEligible,
      confidence: kind === 'unknown' ? 0.25 : 0.8,
      reason: message,
      metadata: Object.freeze({
        ...context,
        source: 'failure-classifier',
      }),
    }) as FailureClassification;
  }

  private detectKind(message: string, context: Record<string, unknown>): FailureClassificationKind {
    if (context.kind && typeof context.kind === 'string') {
      return context.kind as FailureClassificationKind;
    }
    if (/timeout|timed out|etimedout|econnreset|socket hang up/i.test(message)) {
      return 'timeout';
    }
    if (/validation|invalid|malformed|schema|missing required/i.test(message)) {
      return 'validation';
    }
    if (/provider|remote|upstream|bad gateway|service unavailable|rate limit/i.test(message)) {
      return 'provider';
    }
    if (/repository|prisma|database|db|sql|constraint/i.test(message)) {
      return 'repository';
    }
    if (/network|connect|dns|socket|connection refused|fetch failed/i.test(message)) {
      return 'infrastructure';
    }
    if (/synchronization|sync/i.test(message)) {
      return 'synchronization';
    }
    if (/permanent|fatal|hard fail/i.test(message)) {
      return 'permanent';
    }
    if (/unexpected|unknown/i.test(message)) {
      return 'unexpected';
    }
    return 'unknown';
  }

  private isRetryable(kind: FailureClassificationKind): boolean {
    return (
      kind === 'infrastructure' ||
      kind === 'provider' ||
      kind === 'repository' ||
      kind === 'synchronization' ||
      kind === 'timeout' ||
      kind === 'transient'
    );
  }
}
