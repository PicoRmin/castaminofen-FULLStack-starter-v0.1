import type { DiscoveryErrorCode } from '../types';

export abstract class DiscoveryError extends Error {
  public readonly code: DiscoveryErrorCode;
  public readonly stage: string;
  public readonly context: Record<string, unknown> | undefined;
  public readonly cause: unknown;
  public readonly recovery: string | undefined;

  constructor(code: DiscoveryErrorCode, message: string, stage: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super(message);
    this.name = 'DiscoveryError';
    this.code = code;
    this.stage = stage;
    this.context = context;
    this.cause = cause;
    this.recovery = recovery;
  }
}

export class FeedDiscoveryError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('feed-discovery-error', message, 'discovery', context, cause, recovery);
    this.name = 'FeedDiscoveryError';
  }
}

export class FeedValidationError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('feed-validation-error', message, 'validation', context, cause, recovery);
    this.name = 'FeedValidationError';
  }
}

export class FeedIdentityError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('feed-identity-error', message, 'identity', context, cause, recovery);
    this.name = 'FeedIdentityError';
  }
}

export class FeedQualityError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('feed-quality-error', message, 'quality', context, cause, recovery);
    this.name = 'FeedQualityError';
  }
}

export class FeedHealthError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('feed-health-error', message, 'health', context, cause, recovery);
    this.name = 'FeedHealthError';
  }
}

export class CanonicalizationError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('canonicalization-error', message, 'normalization', context, cause, recovery);
    this.name = 'CanonicalizationError';
  }
}

export class FingerprintError extends DiscoveryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('fingerprint-error', message, 'fingerprint', context, cause, recovery);
    this.name = 'FingerprintError';
  }
}
