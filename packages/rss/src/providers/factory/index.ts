import { FactoryError, InvalidProviderError } from '../errors';
import type {
  ProviderConstructor,
  ProviderContract,
  ProviderFactory as ProviderFactoryContract,
  ProviderFactoryContext,
  ProviderMetadata,
} from '../types';

export class ProviderFactory implements ProviderFactoryContract {
  public create<T extends ProviderContract>(
    ctor: ProviderConstructor<T>,
    context?: ProviderFactoryContext,
  ): T {
    if (!ctor || typeof ctor !== 'function') {
      throw new InvalidProviderError('Factory requires a provider constructor.', { ctor });
    }

    try {
      const metadata = context?.metadata ?? this.createMetadata(ctor);
      return new ctor(metadata, context);
    } catch (error) {
      throw new FactoryError('Failed to instantiate provider.', {
        ctor: ctor.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private createMetadata(ctor: Function): ProviderMetadata {
    return {
      id: ctor.name.toLowerCase().replace(/provider$/, ''),
      name: ctor.name.replace(/([a-z])([A-Z])/g, '$1 $2'),
      version: '0.0.0',
      description: 'Auto-generated metadata from the provider factory.',
      priority: 0,
      formats: ['rss'],
      domains: [],
      capabilities: [],
      author: 'Unknown',
      enabled: true,
    };
  }
}
