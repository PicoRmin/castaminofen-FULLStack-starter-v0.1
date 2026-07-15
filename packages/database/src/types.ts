export interface PackageConfig {
  readonly name: string;
  readonly version: string;
  readonly enabled: boolean;
}

export interface PackageContract {
  readonly config: PackageConfig;
  initialize(): string;
}
