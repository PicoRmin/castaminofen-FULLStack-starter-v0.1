import { PackageConfig, PackageContract } from '@castaminofen/types';

export * from '@castaminofen/types';

export interface RuntimeConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly apiBasePath: string;
}

export class ConfigService implements PackageContract {
  constructor(
    public readonly config: PackageConfig,
    private readonly runtimeOverrides: Partial<RuntimeConfig> = {},
  ) {}

  initialize(): string {
    return `${this.config.name} initialized`;
  }

  getRuntimeConfig(): RuntimeConfig {
    return {
      nodeEnv: (process.env.NODE_ENV as RuntimeConfig['nodeEnv']) ?? 'development',
      port: Number(process.env.PORT ?? 3000),
      apiBasePath: this.runtimeOverrides.apiBasePath ?? '/api',
    };
  }
}

export const packageMetadata = {
  name: '@castaminofen/config',
  version: '0.1.0',
  enabled: true,
};
