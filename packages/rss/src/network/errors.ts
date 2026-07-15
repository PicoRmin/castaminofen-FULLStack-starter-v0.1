import type { ErrorContext, HttpNetworkError } from './types';

export class BaseHttpNetworkError extends Error implements HttpNetworkError {
  public readonly code: string;
  public readonly stage: string;
  public readonly status: number;
  public readonly retryable: boolean;
  public readonly context: Record<string, unknown>;
  public readonly cause?: unknown;
  public readonly suggestion: string;

  public constructor(message: string, code: string, stage: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'BaseHttpNetworkError';
    this.code = code;
    this.stage = stage;
    this.status = context.status ?? 0;
    this.retryable = context.retryable ?? false;
    this.context = { ...context.context, url: context.url, method: context.method, status: context.status };
    this.cause = context.cause;
    this.suggestion = context.suggestion ?? 'Retry the request after validating the target URL and network conditions.';
  }
}

export class TimeoutError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'TIMEOUT', 'timeout', context);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'NETWORK_ERROR', 'transport', context);
    this.name = 'NetworkError';
  }
}

export class RedirectLoopError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'REDIRECT_LOOP', 'redirect', context);
    this.name = 'RedirectLoopError';
  }
}

export class DownloadFailedError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'DOWNLOAD_FAILED', 'download', context);
    this.name = 'DownloadFailedError';
  }
}

export class CompressionError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'COMPRESSION_ERROR', 'decompression', context);
    this.name = 'CompressionError';
  }
}

export class UnsupportedEncodingError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'UNSUPPORTED_ENCODING', 'decompression', context);
    this.name = 'UnsupportedEncodingError';
  }
}

export class InvalidContentTypeError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'INVALID_CONTENT_TYPE', 'validation', context);
    this.name = 'InvalidContentTypeError';
  }
}

export class InvalidStatusCodeError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'INVALID_STATUS_CODE', 'validation', context);
    this.name = 'InvalidStatusCodeError';
  }
}

export class CancellationError extends BaseHttpNetworkError {
  public constructor(message: string, context: ErrorContext = {}) {
    super(message, 'CANCELLATION', 'cancellation', context);
    this.name = 'CancellationError';
  }
}
