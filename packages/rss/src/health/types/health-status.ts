export type FeedHealthStatus =
  | 'Excellent'
  | 'Healthy'
  | 'Good'
  | 'Warning'
  | 'Degraded'
  | 'Critical'
  | 'Offline'
  | 'Unknown'
  | (string & {});

export type FeedHealthTrendDirection =
  'Improving' | 'Stable' | 'Declining' | 'Unknown' | (string & {});
