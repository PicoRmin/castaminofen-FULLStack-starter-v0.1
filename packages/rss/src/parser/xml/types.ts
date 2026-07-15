import type { Readable } from 'stream';
import type { XmlError } from './errors';

export type XmlInput = string | Buffer | Uint8Array | Readable;
export type XmlEncoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'iso-8859-1' | 'us-ascii';

export interface XmlEncodingDetectionResult {
  encoding: XmlEncoding;
  source: 'bom' | 'declaration' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

export interface XmlLoadResult {
  buffer: Buffer;
  text: string;
  encoding: XmlEncoding;
}

export interface XmlValidationResult {
  valid: boolean;
  errors: XmlError[];
}
