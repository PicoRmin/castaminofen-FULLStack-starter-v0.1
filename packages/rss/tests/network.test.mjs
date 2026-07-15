import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpRequestBuilder, HttpDownloadService } from '../src/network/index.ts';

test('HttpRequestBuilder creates a GET request with default headers', () => {
  const builder = new HttpRequestBuilder();
  const request = builder.setUrl('https://example.com/feed.xml').setMethod('GET').build();

  assert.equal(request.url, 'https://example.com/feed.xml');
  assert.equal(request.method, 'GET');
  assert.equal(
    request.headers.accept,
    'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
  );
  assert.equal(request.headers['user-agent'], 'castaminofen-rss/1.0');
});

test('HttpDownloadService returns a normalized response for a successful request', async () => {
  const adapter = {
    async execute(request) {
      return {
        status: 200,
        headers: {
          'content-type': 'application/rss+xml; charset=utf-8',
          'content-length': '12',
          etag: 'abc123',
          'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
          'content-encoding': 'identity',
        },
        body: '<rss />',
        bodyBuffer: Buffer.from('<rss />'),
        encoding: 'identity',
        contentLength: 12,
        contentType: 'application/rss+xml; charset=utf-8',
        etag: 'abc123',
        lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
        timing: { dnsMs: 1, connectionMs: 2, tlsMs: 3, downloadMs: 4, totalMs: 10 },
        statistics: { downloadedBytes: 12, compressedBytes: 12, decompressedBytes: 12 },
        redirected: false,
        redirectCount: 0,
        requestId: request.id,
      };
    },
  };

  const service = new HttpDownloadService({
    client: adapter,
    requestBuilder: new HttpRequestBuilder(),
  });

  const result = await service.download('https://example.com/feed.xml');

  assert.equal(result.ok, true);
  assert.equal(result.response?.status, 200);
  assert.equal(result.response?.body, '<rss />');
  assert.equal(result.response?.etag, 'abc123');
});

test('HttpRequestBuilder rejects unsafe URLs that could enable SSRF', () => {
  const builder = new HttpRequestBuilder();

  assert.throws(
    () => builder.setUrl('ftp://example.com/feed.xml').build(),
    /Only http and https URLs are supported/,
  );
  assert.throws(() => builder.setUrl('http://127.0.0.1/feed.xml').build(), /Private or local/);
  assert.throws(() => builder.setUrl('https://localhost/feed.xml').build(), /Private or local/);
});
