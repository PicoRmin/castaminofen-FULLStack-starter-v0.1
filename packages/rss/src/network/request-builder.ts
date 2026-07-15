import type { HttpHeaders, HttpRequest, HttpRequestConfig } from './types';

export class HttpRequestBuilder {
  private method: HttpRequest['method'] = 'GET';
  private url = '';
  private headers: HttpHeaders = {};
  private timeoutMs = 10000;
  private connectTimeoutMs = 3000;
  private readTimeoutMs = 8000;
  private redirectLimit = 5;
  private maxRetries = 2;
  private allowCompression = true;
  private followRedirects = true;
  private userAgent = 'castaminofen-rss/1.0';
  private ifNoneMatch?: string;
  private ifModifiedSince?: string;

  public setMethod(method: HttpRequest['method']): this {
    this.method = method;
    return this;
  }

  public setUrl(url: string): this {
    this.url = url;
    return this;
  }

  public setHeader(name: string, value: string): this {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  public setAuthorization(token: string): this {
    this.headers.authorization = token;
    return this;
  }

  public setIfNoneMatch(value: string): this {
    this.ifNoneMatch = value;
    return this;
  }

  public setIfModifiedSince(value: string): this {
    this.ifModifiedSince = value;
    return this;
  }

  public setHeaders(headers: HttpHeaders): this {
    for (const [name, value] of Object.entries(headers)) {
      if (value !== undefined) {
        this.headers[name.toLowerCase()] = value;
      }
    }
    return this;
  }

  public applyConfig(config: HttpRequestConfig): this {
    if (config.timeoutMs !== undefined) this.timeoutMs = config.timeoutMs;
    if (config.connectTimeoutMs !== undefined) this.connectTimeoutMs = config.connectTimeoutMs;
    if (config.readTimeoutMs !== undefined) this.readTimeoutMs = config.readTimeoutMs;
    if (config.redirectLimit !== undefined) this.redirectLimit = config.redirectLimit;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config.userAgent !== undefined) this.userAgent = config.userAgent;
    if (config.allowCompression !== undefined) this.allowCompression = config.allowCompression;
    if (config.followRedirects !== undefined) this.followRedirects = config.followRedirects;
    return this;
  }

  public build(): HttpRequest {
    if (!this.url) {
      throw new Error('A request URL is required.');
    }

    const parsed = new URL(this.url);
    const headers: HttpHeaders = {
      accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
      'accept-encoding': this.allowCompression ? 'gzip, deflate, br, identity' : 'identity',
      'user-agent': this.userAgent,
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      host: parsed.host,
      ...this.headers,
    };

    if (this.ifNoneMatch) {
      headers['if-none-match'] = this.ifNoneMatch;
    }

    if (this.ifModifiedSince) {
      headers['if-modified-since'] = this.ifModifiedSince;
    }

    return {
      id: this.createRequestId(),
      method: this.method,
      url: this.url,
      headers,
      timeoutMs: this.timeoutMs,
      connectTimeoutMs: this.connectTimeoutMs,
      readTimeoutMs: this.readTimeoutMs,
      redirectLimit: this.redirectLimit,
      maxRetries: this.maxRetries,
      allowCompression: this.allowCompression,
      followRedirects: this.followRedirects,
      ...(this.ifNoneMatch ? { ifNoneMatch: this.ifNoneMatch } : {}),
      ...(this.ifModifiedSince ? { ifModifiedSince: this.ifModifiedSince } : {}),
    };
  }

  private createRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
