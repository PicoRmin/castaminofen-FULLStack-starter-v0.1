export type ProviderIdentifier = string;

export type ProviderPriority = number;

export type ProviderCapabilityName =
  | 'rss'
  | 'atom'
  | 'podcast-namespace'
  | 'authentication'
  | 'incremental-sync'
  | 'conditional-requests'
  | 'redirects'
  | 'compression'
  | 'streaming'
  | (string & {});

export interface ProviderCapability {
  readonly name: ProviderCapabilityName;
  readonly enabled: boolean;
  readonly description?: string;
}

export interface ProviderMetadata {
  readonly id: ProviderIdentifier;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly priority: ProviderPriority;
  readonly formats: readonly string[];
  readonly domains: readonly string[];
  readonly capabilities: readonly ProviderCapability[];
  readonly author: string;
  readonly documentationUrl?: string;
  readonly experimental?: boolean;
  readonly enabled?: boolean;
}

export interface ProviderContext {
  readonly requestId?: string;
  readonly url?: string;
  readonly hostname?: string;
  readonly domain?: string;
  readonly capabilities?: readonly ProviderCapabilityName[];
  readonly metadata?: Partial<ProviderMetadata>;
}

export interface ProviderValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface ProviderStatistics {
  readonly initializedAt?: string;
  readonly lastHealthCheck?: string;
  readonly invocationCount: number;
  readonly lastError?: string;
}

export interface ProviderHealth {
  readonly status: 'ready' | 'unavailable' | 'disabled' | 'experimental' | 'deprecated';
  readonly message?: string;
  readonly details?: string;
}

export interface ProviderResolutionRequest {
  readonly url: string;
  readonly hostname?: string | undefined;
  readonly domain?: string | undefined;
  readonly capabilities?: readonly ProviderCapabilityName[] | undefined;
  readonly format?: string | undefined;
}

export interface ProviderResolutionResult {
  readonly provider?: ProviderContract | undefined;
  readonly score: number;
  readonly matchedHostname?: string | undefined;
  readonly matchedDomain?: string | undefined;
  readonly strategyNames: readonly string[];
  readonly reasons: readonly string[];
}

export interface ProviderDependencyResolver {
  resolve<T>(token: string | symbol): T | undefined;
}

export interface ProviderFactoryContext {
  readonly dependencyResolver?: ProviderDependencyResolver;
  readonly registry?: unknown;
  readonly metadata?: ProviderMetadata;
}

export interface ProviderContract {
  readonly metadata: ProviderMetadata;
  supports(url: string): boolean;
  priority(): ProviderPriority;
  capabilities(): readonly ProviderCapability[];
  initialize?(): Promise<void>;
  shutdown?(): Promise<void>;
  ready?(): boolean;
  health?(): ProviderHealth;
  download?(url: string): Promise<string>;
  parse?(input: string): Promise<unknown>;
  validate?(input: unknown): Promise<ProviderValidationResult>;
  dispose?(): void;
}

export interface ProviderResolutionStrategy {
  readonly name: string;
  evaluate(
    provider: ProviderContract,
    request: ProviderResolutionRequest,
  ): {
    matched: boolean;
    score: number;
    reason: string;
  };
}

export interface ProviderFactory<T extends ProviderContract = ProviderContract> {
  create<C extends T>(ctor: ProviderConstructor<C>, context?: ProviderFactoryContext): C;
}

export interface ProviderConstructor<T extends ProviderContract = ProviderContract> {
  new (metadata: ProviderMetadata, context?: ProviderFactoryContext): T;
}
