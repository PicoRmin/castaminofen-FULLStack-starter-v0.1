import { InvalidContentTypeError, InvalidStatusCodeError, UnsupportedEncodingError } from './errors';
import type { HttpRequest, HttpResponse } from './types';

export interface HttpValidationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
}

export class HttpResponseValidator {
  public validate(request: HttpRequest, response: HttpResponse): HttpValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (response.status < 200 || response.status >= 600) {
      errors.push(`Unexpected HTTP status ${response.status}`);
    }

    if (response.status >= 400) {
      errors.push(`Request failed with HTTP ${response.status}`);
    }

    if (!response.body || response.body.trim().length === 0) {
      warnings.push('The response body is empty.');
    }

    if (!response.contentType && response.body) {
      warnings.push('The response did not include a content type header.');
    }

    if (response.contentType && !/xml|rss|atom/i.test(response.contentType)) {
      errors.push(`Unsupported content type: ${response.contentType}`);
    }

    if (!['gzip', 'deflate', 'br', 'identity'].includes(response.encoding)) {
      errors.push(`Unsupported encoding: ${response.encoding}`);
    }

    if (response.contentLength !== undefined && response.contentLength < 0) {
      errors.push('Content length cannot be negative.');
    }

    if (response.redirected && response.redirectCount > 5) {
      warnings.push('Redirect count exceeded the configured threshold.');
    }

    return {
      ok: errors.length === 0,
      warnings,
      errors,
    };
  }

  public assertValid(request: HttpRequest, response: HttpResponse): void {
    const result = this.validate(request, response);
    if (!result.ok) {
      if (result.errors.some((error) => error.includes('Unsupported content type'))) {
        throw new InvalidContentTypeError(result.errors.join('; '), { url: request.url, method: request.method, status: response.status });
      }
      if (result.errors.some((error) => error.includes('Unsupported encoding'))) {
        throw new UnsupportedEncodingError(result.errors.join('; '), { url: request.url, method: request.method, status: response.status });
      }
      throw new InvalidStatusCodeError(result.errors.join('; '), { url: request.url, method: request.method, status: response.status });
    }
  }
}
