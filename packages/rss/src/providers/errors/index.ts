export interface ProviderErrorContext {
  readonly [key: string]: unknown;
}

export class ProviderFrameworkError extends Error {
  public readonly code: string;
  public readonly stage: string;
  public readonly context: ProviderErrorContext | undefined;
  public readonly suggestedRecovery: string | undefined;

  constructor(
    message: string,
    code: string,
    stage: string,
    context?: ProviderErrorContext,
    suggestedRecovery?: string,
  ) {
    super(message);
    this.name = 'ProviderFrameworkError';
    this.code = code;
    this.stage = stage;
    this.context = context;
    this.suggestedRecovery = suggestedRecovery;
  }
}

export class ProviderRegistrationError extends ProviderFrameworkError {
  constructor(message: string, context?: ProviderErrorContext, suggestedRecovery?: string) {
    super(message, 'provider.registration', 'registration', context, suggestedRecovery);
    this.name = 'ProviderRegistrationError';
  }
}

export class DuplicateProviderError extends ProviderRegistrationError {
  constructor(identifier: string, context?: ProviderErrorContext) {
    super(
      `Provider '${identifier}' is already registered.`,
      context,
      'Use replace() to update an existing registration or unregister the previous entry first.',
    );
    this.name = 'DuplicateProviderError';
  }
}

export class ProviderNotFoundError extends ProviderFrameworkError {
  constructor(identifier: string, context?: ProviderErrorContext) {
    super(
      `Provider '${identifier}' was not found.`,
      'provider.not-found',
      'resolution',
      context,
      'Verify the identifier or register the provider before resolving.',
    );
    this.name = 'ProviderNotFoundError';
  }
}

export class ProviderResolutionError extends ProviderFrameworkError {
  constructor(message: string, context?: ProviderErrorContext, suggestedRecovery?: string) {
    super(message, 'provider.resolution', 'resolution', context, suggestedRecovery);
    this.name = 'ProviderResolutionError';
  }
}

export class CapabilityMismatchError extends ProviderFrameworkError {
  constructor(message: string, context?: ProviderErrorContext) {
    super(
      message,
      'provider.capability-mismatch',
      'validation',
      context,
      'Ensure the provider metadata reflects the capabilities it actually supports.',
    );
    this.name = 'CapabilityMismatchError';
  }
}

export class FactoryError extends ProviderFrameworkError {
  constructor(message: string, context?: ProviderErrorContext) {
    super(
      message,
      'provider.factory',
      'factory',
      context,
      'Ensure the provider constructor is compatible with the configured factory context.',
    );
    this.name = 'FactoryError';
  }
}

export class InvalidProviderError extends ProviderFrameworkError {
  constructor(message: string, context?: ProviderErrorContext) {
    super(
      message,
      'provider.invalid',
      'validation',
      context,
      'Provide a provider with a valid identifier and metadata before registration.',
    );
    this.name = 'InvalidProviderError';
  }
}
