export interface FeedHealthClassificationResult {
  readonly id: string;
  readonly label: string;
  readonly reason: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

export interface FeedHealthClassificationEngine {
  readonly id: string;
  classify(
    score: number,
    status: string,
    metrics: Record<string, number>,
  ): FeedHealthClassificationResult;
}
