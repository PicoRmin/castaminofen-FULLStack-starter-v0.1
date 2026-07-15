import { randomUUID } from 'node:crypto';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { HttpRequestBuilder } from './request-builder';
import { DefaultRetryPolicy } from './retry-policy';
import { HttpResponseValidator } from './validation';
import { CancellationError, DownloadFailedError, NetworkError, RedirectLoopError, TimeoutError, UnsupportedEncodingError } from './errors';
import type { DownloadDiagnosticsHook, DownloadResult, HttpClientAdapter, HttpDiagnosticEvent, HttpRequest, HttpRequestConfig, HttpResponse, HttpNetworkError } from './types';

export interface HttpDownloadServiceOptions {
  client?: HttpClientAdapter;
  requestBuilder?: HttpRequestBuilder;
  retryPolicy?: DefaultRetryPolicy;
  validator?: HttpResponseValidator;
  diagnosticsHooks?: DownloadDiagnosticsHook[];
  config?: HttpRequestConfig;
}

export class HttpDownloadService {
  private readonly client: HttpClientAdapter;
  private readonly requestBuilder: HttpRequestBuilder;
  private readonly retryPolicy: DefaultRetryPolicy;
  private readonly validator: HttpResponseValidator;
  private readonly diagnosticsHooks: DownloadDiagnosticsHook[];
  private readonly config: HttpRequestConfig;

  public constructor(options: HttpDownloadServiceOptions = {}) {
    this.client = options.client ?? createDefaultClient();
    this.requestBuilder = options.requestBuilder ?? new HttpRequestBuilder();
    this.retryPolicy = options.retryPolicy ?? new DefaultRetryPolicy();
    this.validator = options.validator ?? new HttpResponseValidator();
    this.config = options.config ?? {};
    this.diagnosticsHooks = options.diagnosticsHooks ?? [];
  }

  public async download(url: string, config: HttpRequestConfig = {}): Promise<DownloadResult> {
    const request = this.buildRequest(url, config);
    const diagnostics = [...this.diagnosticsHooks, ...(config.diagnosticsHooks ?? [])];
    this.emit(diagnostics, { type: 'request-started', requestId: request.id, message: 'Request started.', details: { url } });

    try {
      const response = await this.executeWithRetry(request, diagnostics, 0);
      this.validator.assertValid(request, response);
      this.emit(diagnostics, { type: 'download-completed', requestId: request.id, message: 'Download completed.', details: { url, status: response.status } });
      return { ok: true, response };
    } catch (error) {
      if (error instanceof CancellationError) {
        this.emit(diagnostics, { type: 'cancelled', requestId: request.id, message: 'Request cancelled.' });
        return { ok: false, error };
      }

      const networkError = this.toNetworkError(error, request);
      this.emit(diagnostics, { type: 'request-completed', requestId: request.id, message: 'Request completed with error.', details: { error: networkError.message } });
      return { ok: false, error: networkError };
    }
  }

  private async executeWithRetry(request: HttpRequest, diagnostics: DownloadDiagnosticsHook[], attempt: number): Promise<HttpResponse> {
    try {
      const response = await this.client.execute(request);
      if (response.status >= 300 && response.status < 400) {
        this.emit(diagnostics, { type: 'redirect-followed', requestId: request.id, message: 'Redirect received.', details: { status: response.status } });
      }
      if (response.status >= 400 && this.retryPolicy.shouldRetry(response.status, request.method, attempt)) {
        const delay = this.retryPolicy.computeDelay(attempt);
        this.emit(diagnostics, { type: 'retry-performed', requestId: request.id, message: 'Retrying request.', details: { attempt, delay } });
        await this.sleep(delay);
        return this.executeWithRetry(request, diagnostics, attempt + 1);
      }
      return response;
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.emit(diagnostics, { type: 'timeout-occurred', requestId: request.id, message: 'Request timed out.' });
        throw error;
      }
      if (error instanceof CancellationError) {
        throw error;
      }
      if (this.retryPolicy.shouldRetry(500, request.method, attempt)) {
        const delay = this.retryPolicy.computeDelay(attempt);
        this.emit(diagnostics, { type: 'retry-performed', requestId: request.id, message: 'Retrying request after failure.', details: { attempt, delay } });
        await this.sleep(delay);
        return this.executeWithRetry(request, diagnostics, attempt + 1);
      }
      throw error;
    }
  }

  private buildRequest(url: string, config: HttpRequestConfig): HttpRequest {
    const baseConfig = { ...this.config, ...config };
    const request = this.requestBuilder
      .setUrl(url)
      .setMethod('GET')
      .applyConfig(baseConfig)
      .build();

    request.id = request.id || randomUUID();
    return request;
  }

  private emit(diagnostics: DownloadDiagnosticsHook[], event: HttpDiagnosticEvent): void {
    for (const hook of diagnostics) {
      hook(event);
    }
  }

  private toNetworkError(error: unknown, request: HttpRequest): HttpNetworkError {
    if (error instanceof TimeoutError) return error;
    if (error instanceof CancellationError) return error;
    if (error instanceof RedirectLoopError) return error;
    if (error instanceof NetworkError) return error;
    if (error instanceof UnsupportedEncodingError) return error;
    if (error instanceof Error) {
      return new DownloadFailedError(error.message, { url: request.url, method: request.method, cause: error, retryable: false });
    }
    return new DownloadFailedError('Unknown download failure.', { url: request.url, method: request.method, cause: error, retryable: false });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function createDefaultClient(): HttpClientAdapter {
  return {
    async execute(request: HttpRequest): Promise<HttpResponse> {
      if (request.signal?.aborted) {
        throw new CancellationError('Request was cancelled before execution.', { url: request.url, method: request.method, retryable: false });
      }

      const startedAt = Date.now();
      let currentUrl = request.url;
      const visited = new Set<string>();
      let redirectCount = 0;

      while (true) {
        if (visited.has(currentUrl)) {
          throw new RedirectLoopError('Redirect loop detected.', { url: currentUrl, method: request.method, retryable: false });
        }
        visited.add(currentUrl);

        const response = await fetch(currentUrl, {
          method: request.method,
          headers: Object.entries(request.headers).reduce<Record<string, string>>((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {}),
          ...(request.signal ? { signal: request.signal } : {}),
        });

        const headers = Object.fromEntries(response.headers.entries());
        const contentEncoding = (headers['content-encoding'] ?? 'identity').toLowerCase();
        const bodyBuffer = Buffer.from(await response.arrayBuffer());
        const decodedBody = decodeBody(bodyBuffer, contentEncoding);
        const location = response.headers.get('location');

        if (response.status >= 300 && response.status < 400 && location && request.followRedirects !== false) {
          redirectCount += 1;
          if (redirectCount > (request.redirectLimit ?? 5)) {
            throw new RedirectLoopError('Maximum redirect limit exceeded.', { url: currentUrl, method: request.method, retryable: false });
          }
          currentUrl = new URL(location, currentUrl).toString();
          continue;
        }

        const totalMs = Date.now() - startedAt;
        return {
          status: response.status,
          headers,
          body: decodedBody,
          bodyBuffer: Buffer.from(decodedBody),
          encoding: contentEncoding,
          contentLength: Number(headers['content-length'] ?? decodedBody.length),
          contentType: headers['content-type'] ?? '',
          etag: headers['etag'] ?? '',
          lastModified: headers['last-modified'] ?? '',
          timing: { totalMs },
          statistics: { downloadedBytes: bodyBuffer.byteLength, compressedBytes: bodyBuffer.byteLength, decompressedBytes: decodedBody.length },
          redirected: redirectCount > 0,
          redirectCount,
          requestId: request.id,
        };
      }
    },
  };
}

function decodeBody(buffer: Buffer, encoding: string): string {
  switch (encoding) {
    case 'gzip':
      return gunzipSync(buffer).toString('utf8');
    case 'deflate':
      return inflateSync(buffer).toString('utf8');
    case 'br':
      return brotliDecompressSync(buffer).toString('utf8');
    case 'identity':
    case '':
      return buffer.toString('utf8');
    default:
      throw new UnsupportedEncodingError(`Unsupported content encoding: ${encoding}`, { retryable: false });
  }
}
