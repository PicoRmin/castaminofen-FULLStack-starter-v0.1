export enum FeedSyncStatus {
  Pending = 'pending',
  Syncing = 'syncing',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export enum ProviderType {
  Generic = 'generic',
  Podbean = 'podbean',
  Castbox = 'castbox',
  Acast = 'acast',
  Omny = 'omny',
  Transistor = 'transistor',
  Shenoto = 'shenoto',
}

export enum ParserFormat {
  Rss = 'rss',
  Atom = 'atom',
  Xml = 'xml',
}

export enum ValidationSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export enum ImportMode {
  Full = 'full',
  Incremental = 'incremental',
}
