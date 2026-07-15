export interface TestLifecycleEvent {
  readonly type: string;
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: number;
}

export interface TestSuiteSummary {
  readonly name: string;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly durationMs: number;
  readonly warnings: readonly string[];
}

export interface ComplianceSummary {
  readonly passed: boolean;
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
  readonly coverageSummary: Record<string, number>;
}
