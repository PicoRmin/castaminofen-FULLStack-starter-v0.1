import { Readable } from 'stream';
import { XmlEncodingError, XmlSyntaxError } from './errors';
import { XmlUtilities } from './utilities';
import type { XmlEncoding, XmlInput, XmlLoadResult } from './types';

export class XmlLoader {
  public async load(input: XmlInput): Promise<XmlLoadResult> {
    if (typeof input === 'string') {
      return this.fromString(input);
    }

    if (Buffer.isBuffer(input)) {
      return this.fromBuffer(input);
    }

    if (input instanceof Uint8Array) {
      return this.fromUint8Array(input);
    }

    if (input instanceof Readable) {
      return this.fromReadable(input);
    }

    throw new XmlSyntaxError('Unsupported XML input type.');
  }

  public fromString(input: string): XmlLoadResult {
    const normalized = XmlUtilities.normalizeLineBreaks(input);
    const buffer = Buffer.from(normalized, 'utf8');
    return {
      buffer,
      text: normalized,
      encoding: 'utf-8',
    };
  }

  public fromBuffer(input: Buffer): XmlLoadResult {
    const text = input.toString('utf8');
    return {
      buffer: Buffer.from(input),
      text,
      encoding: 'utf-8',
    };
  }

  public fromUint8Array(input: Uint8Array): XmlLoadResult {
    const buffer = Buffer.from(input);
    return {
      buffer,
      text: buffer.toString('utf8'),
      encoding: 'utf-8',
    };
  }

  public async fromReadable(input: Readable): Promise<XmlLoadResult> {
    const chunks: Buffer[] = [];
    for await (const chunk of input) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    return {
      buffer,
      text: buffer.toString('utf8'),
      encoding: 'utf-8',
    };
  }
}
