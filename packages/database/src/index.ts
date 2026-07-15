import { PackageConfig, PackageContract } from './types';

export * from './types';

export class DatabaseService implements PackageContract {
  constructor(public readonly config: PackageConfig) {}

  initialize(): string {
    // TODO: implement package-specific initialization.
    return `${this.config.name} initialized`;
  }
}

export const packageMetadata = {
  name: '@castaminofen/database',
  version: '0.1.0',
  enabled: true,
};
