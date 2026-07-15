import { DuplicateProviderError, InvalidProviderError } from '../errors';
import type {
  ProviderCapabilityName,
  ProviderContract,
  ProviderIdentifier,
  ProviderPriority,
} from '../types';

export class ProviderRegistry {
  private readonly providers = new Map<ProviderIdentifier, ProviderContract>();

  public register(provider: ProviderContract): ProviderContract {
    this.assertValidProvider(provider);
    const identifier = provider.metadata.id;

    if (this.providers.has(identifier)) {
      throw new DuplicateProviderError(identifier, { identifier });
    }

    this.providers.set(identifier, provider);
    return provider;
  }

  public replace(provider: ProviderContract): ProviderContract {
    this.assertValidProvider(provider);
    const identifier = provider.metadata.id;
    this.providers.set(identifier, provider);
    return provider;
  }

  public unregister(identifier: ProviderIdentifier): boolean {
    return this.providers.delete(identifier);
  }

  public getAll(): readonly ProviderContract[] {
    return Array.from(this.providers.values()).sort(
      (left, right) => right.priority() - left.priority(),
    );
  }

  public getByIdentifier(identifier: ProviderIdentifier): ProviderContract | undefined {
    return this.providers.get(identifier);
  }

  public getByCapability(capability: ProviderCapabilityName | string): readonly ProviderContract[] {
    return this.getAll().filter((provider) =>
      provider.capabilities().some((item) => item.enabled && item.name === capability),
    );
  }

  public getByPriority(priority: ProviderPriority): readonly ProviderContract[] {
    return this.getAll().filter((provider) => provider.priority() === priority);
  }

  public has(identifier: ProviderIdentifier): boolean {
    return this.providers.has(identifier);
  }

  private assertValidProvider(provider: ProviderContract): void {
    if (!provider || typeof provider !== 'object') {
      throw new InvalidProviderError('Provider registration requires a valid provider instance.', {
        provider,
      });
    }

    if (!provider.metadata?.id || !provider.metadata?.name) {
      throw new InvalidProviderError('Provider metadata must include an identifier and a name.', {
        metadata: provider.metadata,
      });
    }
  }
}
