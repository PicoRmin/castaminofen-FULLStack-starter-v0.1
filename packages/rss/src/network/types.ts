export interface NetworkMetrics {
  dnsMs?: number;
  connectionMs?: number;
  tlsMs?: number;
  downloadMs?: number;
  totalMs?: number;
  downloadedBytes?: number;
  compressedBytes?: number;
  decompressedBytes?: number;
  retryCount?: number;
  redirectCount?: number;
}

export interface HttpHeaders {
  [key: string]: string | undefined;
}

export interface HttpRequest {
  id: string;
  method: 'GET' | 'HEAD' | string;
  url: string;
  headers: HttpHeaders;
  timeoutMs?: number;
  connectTimeoutMs?: number;
  readTimeoutMs?: number;
  redirectLimit?: number;
  maxRetries?: number;
  allowCompression?: boolean;
  followRedirects?: boolean;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  signal?: AbortSignal;
}

export interface HttpResponse {
  status: number;
  headers: HttpHeaders;
  body: string;
  bodyBuffer: Uint8Array;
  encoding: string;
  contentLength?: number;
  contentType?: string;
  etag?: string;
  lastModified?: string;
  timing?: NetworkMetrics;
  statistics?: NetworkMetrics;
  redirected: boolean;
  redirectCount: number;
  requestId: string;
}

export interface HttpClientAdapter {
  execute(request: HttpRequest): Promise<HttpResponse>;
}

export type HttpBackoffStrategy = 'exponential' | 'linear';

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: HttpBackoffStrategy;
  backoffMs: number;
  jitterMs: number;
  retryableStatusCodes: number[];
  retryableMethods: string[];
}

export interface DownloadDiagnosticsHook {
  (event: HttpDiagnosticEvent): void;
}

export type HttpDiagnosticEventType =
  | 'request-started'
  | 'request-completed'
  | 'retry-performed'
  | 'redirect-followed'
  | 'download-completed'
  | 'timeout-occurred'
  | 'cancelled'
  | 'validation-warning';

export interface HttpDiagnosticEvent {
  type: HttpDiagnosticEventType;
  requestId: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DownloadResult {
  ok: boolean;
  response?: HttpResponse;
  error?: HttpNetworkError;
}

export interface ErrorContext {
  url?: string;
  method?: string;
  status?: number;
  stage?: string;
  retryable?: boolean;
  context?: Record<string, unknown>;
  cause?: unknown;
  suggestion?: string;
}

export interface HttpNetworkError extends Error {
  code: string;
  stage: string;
  status: number;
  retryable: boolean;
  context: Record<string, unknown>;
  cause?: unknown;
  suggestion: string;
}

export interface HttpRequestConfig {
  timeoutMs?: number;
  connectTimeoutMs?: number;
  readTimeoutMs?: number;
  redirectLimit?: number;
  maxRetries?: number;
  backoffStrategy?: HttpBackoffStrategy;
  backoffMs?: number;
  jitterMs?: number;
  retryableStatusCodes?: number[];
  retryableMethods?: string[];
  userAgent?: string;
  allowCompression?: boolean;
  followRedirects?: boolean;
  diagnosticsHooks?: DownloadDiagnosticsHook[];
}
