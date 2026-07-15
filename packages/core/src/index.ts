import { PackageConfig, PackageContract } from '@castaminofen/types';

export * from '@castaminofen/types';

export class CoreService implements PackageContract {
  constructor(public readonly config: PackageConfig) {}

  initialize(): string {
    return `${this.config.name} initialized`;
  }

  createId(prefix: string): string {
    const value = typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return `${prefix}_${value}`;
  }
}

export const packageMetadata = {
  name: '@castaminofen/core',
  version: '0.1.0',
  enabled: true,
};
