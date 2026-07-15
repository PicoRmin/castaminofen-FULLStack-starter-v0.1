import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

import {
  LoggerAdapter,
  MediaKind,
  MediaMetadata,
  MediaStatus,
  MediaStorageAdapter,
  MediaUploadRequest,
  PackageConfig,
  PackageContract,
  ProcessingJob,
  PrismaLikeClient,
  QueueAdapter,
  MetricsAdapter,
  ResumableUploadSession,
  ThumbnailMetadata,
  UploadResult,
} from './types.js';

export * from './types.js';

class NoopLogger implements LoggerAdapter {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
}

class NoopMetrics implements MetricsAdapter {
  increment(): void {}
  observe(): void {}
}

export class InMemoryQueueAdapter implements QueueAdapter {
  private readonly jobs: ProcessingJob[] = [];

  async enqueue(job: ProcessingJob): Promise<string> {
    this.jobs.push(job);
    return job.id;
  }

  list(): ProcessingJob[] {
    return [...this.jobs];
  }
}

export class LocalStorageAdapter implements MediaStorageAdapter {
  constructor(
    private readonly options: { baseDir: string; publicBaseUrl?: string } = {
      baseDir: './uploads',
    },
  ) {}

  async putObject(
    key: string,
    buffer: Buffer,
  ): Promise<{ key: string; size: number; publicUrl?: string }> {
    const destinationPath = path.join(this.options.baseDir, key);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.writeFile(destinationPath, buffer);
    return {
      key,
      size: buffer.byteLength,
      publicUrl: this.getPublicUrl(key),
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.getPublicUrl(key);
  }

  async streamObject(key: string): Promise<Readable | null> {
    const destinationPath = path.join(this.options.baseDir, key);
    try {
      const stat = await fs.stat(destinationPath);
      if (!stat.isFile()) {
        return null;
      }
      return Readable.from(await fs.readFile(destinationPath));
    } catch {
      return null;
    }
  }

  private getPublicUrl(key: string): string {
    const base = this.options.publicBaseUrl ?? 'file://local';
    return `${base.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
  }
}

export class S3StorageAdapter implements MediaStorageAdapter {
  constructor(
    private readonly options: {
      bucket: string;
      endpoint?: string;
      publicBaseUrl?: string;
      client?: unknown;
    },
  ) {}

  async putObject(
    key: string,
    buffer: Buffer,
  ): Promise<{ key: string; size: number; publicUrl?: string }> {
    if (!this.options.client) {
      return { key, size: buffer.byteLength, publicUrl: this.getPublicUrl(key) };
    }
    return { key, size: buffer.byteLength, publicUrl: this.getPublicUrl(key) };
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.getPublicUrl(key);
  }

  async streamObject(): Promise<Readable | null> {
    return null;
  }

  private getPublicUrl(key: string): string {
    const base = this.options.publicBaseUrl ?? `https://${this.options.bucket}.s3.amazonaws.com`;
    return `${base.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
  }
}

export class CloudflareR2StorageAdapter implements MediaStorageAdapter {
  constructor(
    private readonly options: {
      bucket: string;
      endpoint?: string;
      publicBaseUrl?: string;
      client?: unknown;
    },
  ) {}

  async putObject(
    key: string,
    buffer: Buffer,
  ): Promise<{ key: string; size: number; publicUrl?: string }> {
    if (!this.options.client) {
      return { key, size: buffer.byteLength, publicUrl: this.getPublicUrl(key) };
    }
    return { key, size: buffer.byteLength, publicUrl: this.getPublicUrl(key) };
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.getPublicUrl(key);
  }

  async streamObject(): Promise<Readable | null> {
    return null;
  }

  private getPublicUrl(key: string): string {
    const base =
      this.options.publicBaseUrl ?? `https://${this.options.bucket}.r2.cloudflarestorage.com`;
    return `${base.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
  }
}

export class PrismaMediaRepository {
  constructor(
    private readonly prisma?: PrismaLikeClient,
    private readonly modelName = 'mediaAsset',
  ) {}

  async createAsset(input: Record<string, unknown>): Promise<unknown> {
    const model = this.prisma?.[this.modelName] as
      { create?: (args: { data: Record<string, unknown> }) => Promise<unknown> } | undefined;
    if (typeof model?.create === 'function') {
      return model.create({ data: input });
    }
    return null;
  }

  async updateAsset(id: string, updates: Record<string, unknown>): Promise<unknown> {
    const model = this.prisma?.[this.modelName] as
      | {
          update?: (args: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => Promise<unknown>;
        }
      | undefined;
    if (typeof model?.update === 'function') {
      return model.update({ where: { id }, data: updates });
    }
    return null;
  }
}

export class MediaService implements PackageContract {
  private readonly storage: MediaStorageAdapter;
  private readonly queue: QueueAdapter;
  private readonly logger: LoggerAdapter;
  private readonly metrics: MetricsAdapter;
  private readonly repository: PrismaMediaRepository;
  private readonly resumableUploads = new Map<
    string,
    ResumableUploadSession & { parts: Buffer[] }
  >();

  constructor(public readonly config: PackageConfig) {
    this.storage = config.storage ?? new LocalStorageAdapter();
    this.queue = config.queue ?? new InMemoryQueueAdapter();
    this.logger = config.logger ?? new NoopLogger();
    this.metrics = config.metrics ?? new NoopMetrics();
    this.repository = new PrismaMediaRepository(config.prisma);
  }

  initialize(): string {
    return `${this.config.name} initialized`;
  }

  async upload(input: MediaUploadRequest): Promise<UploadResult> {
    const metadata = await this.extractMetadata(input);
    const key = this.buildObjectKey(input.fileName);
    const bucket = 'media';

    await this.storage.putObject(key, input.buffer, {
      contentType: input.contentType,
      size: input.size,
    });

    const processingJobId = await this.queue.enqueue({
      id: randomUUID(),
      type: 'process-media',
      mediaKey: key,
      contentType: input.contentType,
      metadata,
      attempts: 0,
    });

    const signedUrl = await this.storage.getSignedUrl(key);
    const uploadResult: UploadResult = {
      id: key,
      key,
      bucket,
      status: 'queued',
      contentType: input.contentType,
      signedUrl,
      processingJobId,
      metadata,
      publicUrl: this.getPublicUrl(key),
    };

    await this.repository.createAsset({
      id: key,
      fileName: input.fileName,
      contentType: input.contentType,
      size: input.size,
      status: 'queued',
      createdAt: new Date().toISOString(),
    });

    this.logger.info('media.upload.accepted', { key, contentType: input.contentType });
    this.metrics.increment('media.upload.accepted');
    return uploadResult;
  }

  async createResumableUpload(
    input: Omit<MediaUploadRequest, 'buffer'> & { size: number },
  ): Promise<ResumableUploadSession> {
    const key = this.buildObjectKey(input.fileName);
    const session: ResumableUploadSession & { parts: Buffer[] } = {
      id: randomUUID(),
      key,
      fileName: input.fileName,
      contentType: input.contentType,
      size: input.size,
      uploadedBytes: 0,
      status: 'initialized',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      parts: [],
    };

    this.resumableUploads.set(session.id, session);
    this.logger.info('media.upload.resumable.created', { sessionId: session.id, key });
    return session;
  }

  async appendResumableUploadPart(
    sessionId: string,
    chunk: Buffer,
  ): Promise<ResumableUploadSession> {
    const session = this.resumableUploads.get(sessionId);
    if (!session) {
      throw new Error(`Resumable upload session ${sessionId} not found`);
    }
    session.parts.push(Buffer.from(chunk));
    session.uploadedBytes += chunk.byteLength;
    session.status = 'uploading';
    return session;
  }

  async completeResumableUpload(sessionId: string): Promise<UploadResult> {
    const session = this.resumableUploads.get(sessionId);
    if (!session) {
      throw new Error(`Resumable upload session ${sessionId} not found`);
    }

    const buffer = Buffer.concat(session.parts);
    const uploadResult = await this.upload({
      fileName: session.fileName,
      contentType: session.contentType,
      size: buffer.byteLength,
      buffer,
    });

    session.status = 'completed';
    this.resumableUploads.delete(sessionId);
    return uploadResult;
  }

  async processJob(job: ProcessingJob): Promise<MediaMetadata> {
    const metadata = this.applyProcessing(job);
    await this.repository.updateAsset(job.mediaKey, {
      status: 'ready',
      processedAt: new Date().toISOString(),
      waveform: metadata.waveform,
      thumbnail: metadata.thumbnail,
    });

    this.logger.info('media.processing.completed', { key: job.mediaKey });
    this.metrics.increment('media.processing.completed');
    return metadata;
  }

  async streamObject(key: string): Promise<Readable | null> {
    return this.storage.streamObject(key);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.storage.getSignedUrl(key, expiresInSeconds);
  }

  getPublicUrl(key: string): string {
    return this.storage
      .getSignedUrl(key)
      .catch(() => '')
      .toString();
  }

  async getMetadata(key: string): Promise<MediaMetadata> {
    const checksum = createHash('sha256').update(key).digest('hex');
    return {
      fileName: key.split('/').pop() ?? key,
      contentType: 'application/octet-stream',
      size: 0,
      checksum,
      extension: path.extname(key),
      mimeCategory: 'unknown',
      createdAt: new Date().toISOString(),
      duration: undefined,
      waveform: undefined,
      thumbnail: undefined,
    };
  }

  private buildObjectKey(fileName: string): string {
    const extension = path.extname(fileName);
    const safeName = path.basename(fileName, extension).replace(/[^a-zA-Z0-9.-]+/g, '-');
    return `uploads/${new Date().toISOString().slice(0, 10)}/${safeName}-${randomUUID()}${extension}`;
  }

  private async extractMetadata(input: MediaUploadRequest): Promise<MediaMetadata> {
    const checksum = createHash('sha256').update(input.buffer).digest('hex');
    const extension = path.extname(input.fileName).toLowerCase();
    const mimeCategory = this.detectMediaKind(input.contentType, input.buffer);
    const waveform = mimeCategory === 'audio' ? this.generateWaveform(input.buffer, 64) : undefined;
    const thumbnail = await this.generateThumbnail(input.fileName, input.contentType, input.buffer);

    return {
      fileName: input.fileName,
      contentType: input.contentType,
      size: input.size,
      checksum,
      extension,
      mimeCategory,
      createdAt: new Date().toISOString(),
      duration:
        mimeCategory === 'audio'
          ? Math.max(1, Math.round(input.buffer.byteLength / 16000))
          : undefined,
      waveform,
      thumbnail,
    };
  }

  private detectMediaKind(contentType: string, buffer: Buffer): MediaKind {
    if (contentType.startsWith('image/')) {
      return 'image';
    }
    if (contentType.startsWith('audio/')) {
      return 'audio';
    }
    if (contentType.startsWith('video/')) {
      return 'video';
    }
    if (buffer.subarray(0, 4).toString('hex').startsWith('89504e47')) {
      return 'image';
    }
    if (buffer.subarray(0, 4).toString('hex').startsWith('ffd8ff')) {
      return 'image';
    }
    return 'unknown';
  }

  private generateWaveform(buffer: Buffer, samples = 64): number[] {
    const values: number[] = [];
    const chunkSize = Math.max(1, Math.floor(buffer.byteLength / samples));
    for (let index = 0; index < samples; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(buffer.byteLength, start + chunkSize);
      let sum = 0;
      for (let cursor = start; cursor < end; cursor += 1) {
        sum += buffer[cursor] ?? 0;
      }
      values.push(Math.round(sum / Math.max(1, end - start) / 255) * 100);
    }
    return values;
  }

  private async generateThumbnail(
    fileName: string,
    contentType: string,
    buffer: Buffer,
  ): Promise<ThumbnailMetadata | undefined> {
    const key = `thumbnails/${this.buildObjectKey(fileName).replace(/^uploads\//, '')}.svg`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#111827"/><text x="10" y="60" fill="#f9fafb" font-size="12">${contentType}</text><text x="10" y="80" fill="#9ca3af" font-size="10">${fileName}</text></svg>`;
    await this.storage.putObject(key, Buffer.from(svg), { contentType: 'image/svg+xml' });
    return {
      key,
      url: await this.storage.getSignedUrl(key),
      contentType: 'image/svg+xml',
      width: 120,
      height: 120,
    };
  }

  private applyProcessing(job: ProcessingJob): MediaMetadata {
    const duration = job.contentType.startsWith('audio/')
      ? Math.max(1, Math.round(job.metadata.size ?? 0 / 16000))
      : undefined;
    return {
      fileName: job.metadata.fileName ?? job.mediaKey,
      contentType: job.contentType,
      size: job.metadata.size ?? 0,
      checksum: job.metadata.checksum ?? 'unknown',
      extension: path.extname(job.mediaKey),
      mimeCategory: this.detectMediaKind(job.contentType, Buffer.alloc(0)),
      createdAt: new Date().toISOString(),
      duration,
      waveform: job.metadata.waveform,
      thumbnail: job.metadata.thumbnail,
    };
  }
}

export const packageMetadata = {
  name: '@castaminofen/media',
  version: '0.1.0',
  enabled: true,
};
