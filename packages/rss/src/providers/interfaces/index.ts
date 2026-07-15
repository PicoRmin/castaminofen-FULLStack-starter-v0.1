import type {
  ProviderMetadata,
  ProviderContract,
  ProviderCapability,
  ProviderHealth,
  ProviderValidationResult,
  ProviderResolutionRequest,
  ProviderResolutionResult,
  ProviderContext,
  ProviderStatistics,
  ProviderDependencyResolver,
  ProviderFactoryContext,
  ProviderFactory,
  ProviderConstructor,
} from '../types';

export type {
  ProviderContract,
  ProviderMetadata,
  ProviderCapability,
  ProviderHealth,
  ProviderValidationResult,
  ProviderResolutionRequest,
  ProviderResolutionResult,
  ProviderContext,
  ProviderStatistics,
  ProviderDependencyResolver,
  ProviderFactoryContext,
  ProviderFactory,
  ProviderConstructor,
};

export interface ProviderLifecycleHooks {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  dispose(): void;
}

export interface ProviderRuntimeHooks extends ProviderLifecycleHooks {
  ready(): boolean;
  health(): ProviderHealth;
}

export interface ProviderParserHooks {
  parse(input: string): Promise<unknown>;
}

export interface ProviderDownloadHooks {
  download(url: string): Promise<string>;
}

export interface ProviderValidationHooks {
  validate(input: unknown): Promise<ProviderValidationResult>;
}
