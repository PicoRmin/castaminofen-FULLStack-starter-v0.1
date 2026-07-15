import type { HttpResponse } from '../../network';

export type DiscoveryWarningCode =
  | 'missing-language'
  | 'missing-image'
  | 'weak-metadata'
  | 'deprecated-field'
  | 'unknown-namespace'
  | 'large-feed'
  | 'unexpected-mime-type'
  | 'empty-feed'
  | 'missing-title'
  | 'missing-link'
  | 'missing-description'
  | 'missing-publisher'
  | 'weak-identity';

export type DiscoveryErrorCode =
  | 'feed-discovery-error'
  | 'feed-validation-error'
  | 'feed-identity-error'
  | 'feed-quality-error'
  | 'feed-health-error'
  | 'canonicalization-error'
  | 'fingerprint-error';

export interface DiscoveryWarning {
  readonly code: DiscoveryWarningCode;
  readonly message: string;
  readonly stage: 'validation' | 'quality' | 'health' | 'identity' | 'normalization' | 'discovery';
  readonly severity: 'info' | 'warning' | 'high';
}

export interface DiscoveryErrorInfo {
  readonly code: DiscoveryErrorCode;
  readonly message: string;
  readonly stage: string;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;
  readonly recovery?: string;
}

export interface DiscoveryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly DiscoveryErrorInfo[];
  readonly warnings: readonly DiscoveryWarning[];
  readonly checks: Record<string, boolean>;
}

export interface DiscoveryNormalizedFeed {
  canonicalUrl?: string;
  originalUrl?: string;
  resolvedUrl?: string;
  homepageUrl?: string;
  websiteUrl?: string;
  title?: string;
  language?: string;
  version?: string;
  generator?: string;
  publisher?: string;
  description?: string;
  categories?: readonly string[];
  authors?: readonly string[];
  mediaUrls?: readonly string[];
  updatedAt?: string;
  itemCount?: number;
}

export interface DiscoveryIdentity {
  primaryKey: string;
  confidence: number;
  canonicalUrl?: string;
  normalizedUrl?: string;
  feedGuid?: string;
  websiteUrl?: string;
  title?: string;
  language?: string;
  publisher?: string;
  signals: ReadonlyArray<{ type: string; value: string }>;
}

export interface DiscoveryFingerprint {
  value: string;
  algorithm: string;
  seed: string;
}

export interface DiscoveryQualityAssessment {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  indicators: Record<string, boolean>;
  warnings: readonly DiscoveryWarning[];
}

export interface DiscoveryHealthAssessment {
  status: 'healthy' | 'warning' | 'poor' | 'broken' | 'unknown';
  score: number;
  reasons: readonly string[];
}

export interface DiscoveryStatistics {
  warningCount: number;
  errorCount: number;
  signalCount: number;
  qualityScore: number;
}

export interface DiscoveryTiming {
  startedAt: string;
  completedAt: string;
  totalMs: number;
}

export interface DiscoveryRequest {
  readonly originalUrl: string;
  readonly resolvedUrl?: string;
  readonly rawContent?: string;
  readonly parserResult?: Record<string, unknown> | null;
  readonly metadata?: Partial<DiscoveryNormalizedFeed> & Record<string, unknown>;
  readonly httpResponse?: HttpResponse;
  readonly fingerprintAlgorithm?: string;
}

export interface DiscoveryResult {
  originalUrl: string;
  canonicalUrl?: string;
  resolvedUrl?: string;
  normalizedFeed: DiscoveryNormalizedFeed;
  identity: DiscoveryIdentity;
  fingerprint: DiscoveryFingerprint;
  validation: DiscoveryValidationResult;
  quality: DiscoveryQualityAssessment;
  health: DiscoveryHealthAssessment;
  warnings: readonly DiscoveryWarning[];
  errors: readonly DiscoveryErrorInfo[];
  statistics: DiscoveryStatistics;
  timing: DiscoveryTiming;
}
