import type {
  ProviderCapability,
  ProviderContract,
  ProviderHealth,
  ProviderMetadata,
  ProviderPriority,
  ProviderValidationResult,
} from '../types';

export abstract class BaseProvider implements ProviderContract {
  public constructor(protected readonly providerMetadata: ProviderMetadata) {}

  public get metadata(): ProviderMetadata {
    return this.providerMetadata;
  }

  public supports(_url: string): boolean {
    return true;
  }

  public priority(): ProviderPriority {
    return this.providerMetadata.priority;
  }

  public capabilities(): readonly ProviderCapability[] {
    return this.providerMetadata.capabilities;
  }

  public async initialize(): Promise<void> {
    return undefined;
  }

  public async shutdown(): Promise<void> {
    return undefined;
  }

  public ready(): boolean {
    return this.providerMetadata.enabled !== false;
  }

  public health(): ProviderHealth {
    if (this.providerMetadata.enabled === false) {
      return { status: 'disabled', message: 'Provider disabled by configuration.' };
    }

    if (this.providerMetadata.experimental) {
      return { status: 'experimental', message: 'Provider is marked experimental.' };
    }

    return { status: 'ready', message: 'Provider ready.' };
  }

  public async download(url: string): Promise<string> {
    return url;
  }

  public async parse(_input: string): Promise<unknown> {
    return undefined;
  }

  public async validate(_input: unknown): Promise<ProviderValidationResult> {
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  public dispose(): void {
    return undefined;
  }
}
