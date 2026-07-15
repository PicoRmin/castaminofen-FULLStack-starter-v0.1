import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryQueueAdapter, LocalStorageAdapter, MediaService } from './index.js';

test('uploads to local storage and queues processing', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'media-service-'));
  const service = new MediaService({
    name: '@castaminofen/media',
    version: '0.1.0',
    enabled: true,
    storage: new LocalStorageAdapter({
      baseDir: tempDir,
      publicBaseUrl: 'https://example.test/media',
    }),
    queue: new InMemoryQueueAdapter(),
  });

  const result = await service.upload({
    fileName: 'demo.mp3',
    contentType: 'audio/mpeg',
    size: 12,
    buffer: Buffer.from('hello-world'),
  });

  assert.equal(result.status, 'queued');
  assert.ok(result.key.endsWith('.mp3'));
  assert.match(result.signedUrl, /https:\/\/example\.test\/media/);
  assert.ok(result.processingJobId);
});

test('supports resumable uploads for later completion', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'media-resumable-'));
  const service = new MediaService({
    name: '@castaminofen/media',
    version: '0.1.0',
    enabled: true,
    storage: new LocalStorageAdapter({ baseDir: tempDir }),
    queue: new InMemoryQueueAdapter(),
  });

  const session = await service.createResumableUpload({
    fileName: 'clip.wav',
    contentType: 'audio/wav',
    size: 8,
  });

  await service.appendResumableUploadPart(session.id, Buffer.from('abc'));
  await service.appendResumableUploadPart(session.id, Buffer.from('def'));

  const completed = await service.completeResumableUpload(session.id);

  assert.equal(completed.status, 'queued');
  assert.equal(completed.contentType, 'audio/wav');
});
