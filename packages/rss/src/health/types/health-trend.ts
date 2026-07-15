export interface FeedHealthTrend {
  readonly direction: 'Improving' | 'Stable' | 'Declining' | 'Unknown' | (string & {});
  readonly confidence: number;
  readonly previousScore?: number | undefined;
  readonly currentScore?: number | undefined;
}
