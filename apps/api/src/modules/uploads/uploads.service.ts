import { Injectable } from '@nestjs/common';
import { MediaService, LocalStorageAdapter, InMemoryQueueAdapter } from '@castaminofen/media';

@Injectable()
export class UploadsService {
  private readonly mediaService = new MediaService({
    name: '@castaminofen/media',
    version: '0.1.0',
    enabled: true,
    storage: new LocalStorageAdapter({
      baseDir: './uploads',
      publicBaseUrl: process.env.MEDIA_PUBLIC_BASE_URL ?? 'http://localhost:3000/uploads',
    }),
    queue: new InMemoryQueueAdapter(),
  });

  async upload() {
    const sampleBuffer = Buffer.from('demo-upload');
    return this.mediaService.upload({
      fileName: 'placeholder-upload.txt',
      contentType: 'text/plain',
      size: sampleBuffer.byteLength,
      buffer: sampleBuffer,
      metadata: {
        source: 'api-upload-endpoint',
      },
    });
  }
}
