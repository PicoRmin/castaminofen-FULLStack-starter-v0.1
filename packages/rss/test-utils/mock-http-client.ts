import type { HttpClientAdapter, HttpRequest, HttpResponse } from '../src/network/types';

export interface MockHttpResponseDefinition {
  readonly status: number;
  readonly headers?: Record<string, string>;
  readonly body: string;
  readonly contentType?: string;
  readonly encoding?: string;
  readonly redirectLocation?: string;
}

export class MockHttpClient implements HttpClientAdapter {
  public constructor(private readonly responses: readonly MockHttpResponseDefinition[] = []) {}

  public async execute(request: HttpRequest): Promise<HttpResponse> {
    const responseDefinition = this.responses[0] ?? {
      status: 200,
      headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
      body: '<rss version="2.0"><channel><title>Mock</title></channel></rss>',
    };

    const headers = { ...responseDefinition.headers, 'content-type': responseDefinition.contentType ?? responseDefinition.headers?.['content-type'] ?? 'application/rss+xml; charset=utf-8' };

    if (responseDefinition.redirectLocation) {
      headers.location = responseDefinition.redirectLocation;
    }

    return {
      status: responseDefinition.status,
      headers,
      body: responseDefinition.body,
      bodyBuffer: Buffer.from(responseDefinition.body),
      encoding: responseDefinition.encoding ?? 'identity',
      contentType: headers['content-type'],
      contentLength: responseDefinition.body.length,
      etag: headers.etag ?? '',
      lastModified: headers['last-modified'] ?? '',
      timing: { totalMs: 1 },
      statistics: { downloadedBytes: responseDefinition.body.length, compressedBytes: responseDefinition.body.length, decompressedBytes: responseDefinition.body.length },
      redirected: Boolean(responseDefinition.redirectLocation),
      redirectCount: responseDefinition.redirectLocation ? 1 : 0,
      requestId: request.id,
    };
  }
}
