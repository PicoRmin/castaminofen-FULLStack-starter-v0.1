import { ProviderFrameworkError } from '../errors';

export class GenericProviderError extends ProviderFrameworkError {
  constructor(message: string, code: string, stage: string, context?: Record<string, unknown>) {
    super(
      message,
      code,
      stage,
      context,
      'Review the provider input, network response, or parser output and retry with corrected data.',
    );
    this.name = 'GenericProviderError';
  }
}

export class InvalidFeedUrlError extends GenericProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'provider.generic.invalid-feed-url', 'validation', context);
    this.name = 'InvalidFeedUrlError';
  }
}

export class UnsupportedProtocolError extends GenericProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'provider.generic.unsupported-protocol', 'validation', context);
    this.name = 'UnsupportedProtocolError';
  }
}

export class DownloadFailedError extends GenericProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'provider.generic.download-failed', 'download', context);
    this.name = 'DownloadFailedError';
  }
}

export class EmptyResponseError extends GenericProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'provider.generic.empty-response', 'download', context);
    this.name = 'EmptyResponseError';
  }
}

export class UnsupportedContentTypeError extends GenericProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'provider.generic.unsupported-content-type', 'download', context);
    this.name = 'UnsupportedContentTypeError';
  }
}

export class ProviderExecutionError extends GenericProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'provider.generic.execution', 'execute', context);
    this.name = 'ProviderExecutionError';
  }
}
