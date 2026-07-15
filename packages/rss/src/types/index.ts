export type FeedIdentifier = string;

export type EpisodeIdentifier = string;

export type ParserResult = {
  format?: string;
  success: boolean;
  data?: unknown;
};

export type ProviderResult = {
  provider?: string;
  success: boolean;
  data?: {
    feed?: unknown;
    episodes?: readonly unknown[];
    warnings?: readonly unknown[];
    errors?: readonly unknown[];
    metadata?: {
      provider?: unknown;
      statistics?: ProviderStatistics;
      timings?: Record<string, number | string | undefined>;
    };
  };
};

export interface ProviderStatistics {
  readonly initializedAt?: string;
  readonly lastHealthCheck?: string;
  readonly invocationCount: number;
  readonly lastError?: string;
}

export type ImportResult = {
  success: boolean;
  importedCount?: number;
  data?: unknown;
};

export type SyncResult = {
  success: boolean;
  syncedCount?: number;
  data?: unknown;
};

export type XmlNode = {
  name: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  value?: string;
};

export type XmlAttribute = {
  name: string;
  value: string;
};
