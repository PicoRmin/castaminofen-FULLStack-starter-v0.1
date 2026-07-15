import type { Readable } from 'node:stream';

export interface PackageConfig {
  readonly name: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly storage?: MediaStorageAdapter;
  readonly queue?: QueueAdapter;
  readonly logger?: LoggerAdapter;
  readonly metrics?: MetricsAdapter;
  readonly prisma?: PrismaLikeClient;
  readonly basePath?: string;
}

export interface PackageContract {
  readonly config: PackageConfig;
  initialize(): string;
}

export type MediaKind = 'image' | 'audio' | 'video' | 'document' | 'unknown';
export type MediaStatus = 'queued' | 'uploaded' | 'processing' | 'ready' | 'failed';

export interface MediaUploadRequest {
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly buffer: Buffer;
  readonly metadata?: Record<string, unknown>;
  readonly userId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
}

export interface UploadResult {
  readonly id: string;
  readonly key: string;
  readonly bucket: string;
  readonly status: MediaStatus;
  readonly contentType: string;
  readonly signedUrl: string;
  readonly processingJobId: string;
  readonly metadata: MediaMetadata;
  readonly publicUrl?: string;
}

export interface MediaMetadata {
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly checksum: string;
  readonly extension: string;
  readonly mimeCategory: MediaKind;
  readonly duration: number | undefined;
  readonly waveform: number[] | undefined;
  readonly thumbnail: ThumbnailMetadata | undefined;
  readonly createdAt: string;
  readonly [key: string]: unknown;
}

export interface ThumbnailMetadata {
  readonly key: string;
  readonly url: string;
  readonly contentType: string;
  readonly width: number;
  readonly height: number;
}

export interface ResumableUploadSession {
  readonly id: string;
  readonly key: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  uploadedBytes: number;
  status: 'initialized' | 'uploading' | 'completed' | 'failed';
  readonly expiresAt: string;
}

export interface ProcessingJob {
  readonly id: string;
  readonly type: 'process-media';
  readonly mediaKey: string;
  readonly contentType: string;
  readonly metadata: Partial<MediaMetadata>;
  readonly attempts: number;
}

export interface MediaStorageAdapter {
  putObject(
    key: string,
    buffer: Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<{ key: string; size: number; publicUrl?: string }>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  streamObject(key: string): Promise<Readable | null>;
  deleteObject?(key: string): Promise<void>;
}

export interface QueueAdapter {
  enqueue(job: ProcessingJob): Promise<string>;
}

export interface LoggerAdapter {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface MetricsAdapter {
  increment(name: string, value?: number, labels?: Record<string, string>): void;
  observe(name: string, value: number, labels?: Record<string, string>): void;
}

export interface PrismaLikeClient {
  readonly [key: string]: unknown;
}
