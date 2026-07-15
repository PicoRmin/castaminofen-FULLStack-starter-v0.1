import { XmlUtilities } from './utilities';
import { UnsupportedEncodingError, XmlEncodingError } from './errors';
import type { XmlEncoding, XmlEncodingDetectionResult } from './types';

export class XmlEncodingDetector {
  private static readonly BOM_MAP: Record<string, XmlEncoding> = {
    utf8: 'utf-8',
    utf16le: 'utf-16le',
    utf16be: 'utf-16be',
  };

  public detect(buffer: Buffer): XmlEncodingDetectionResult {
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return { encoding: 'utf-8', source: 'bom', confidence: 'high' };
    }

    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return { encoding: 'utf-16le', source: 'bom', confidence: 'high' };
    }

    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return { encoding: 'utf-16be', source: 'bom', confidence: 'high' };
    }

    const declaration = this.detectFromDeclaration(buffer);
    if (declaration) {
      return declaration;
    }

    return this.detectFallback(buffer);
  }

  public detectFromDeclaration(buffer: Buffer): XmlEncodingDetectionResult | null {
    const text = buffer.toString('latin1');
    const match = text.match(/<\?xml[^>]*encoding=["']([^"']+)["'][^>]*\?>/i);
    if (!match || !match[1]) {
      return null;
    }

    const declaredEncoding = match[1].trim().toLowerCase();
    if (declaredEncoding === 'utf-8') {
      return { encoding: 'utf-8', source: 'declaration', confidence: 'high' };
    }
    if (declaredEncoding === 'utf-16le' || declaredEncoding === 'utf-16') {
      return { encoding: 'utf-16le', source: 'declaration', confidence: 'high' };
    }
    if (declaredEncoding === 'utf-16be') {
      return { encoding: 'utf-16be', source: 'declaration', confidence: 'high' };
    }
    if (declaredEncoding === 'iso-8859-1' || declaredEncoding === 'latin1') {
      return { encoding: 'iso-8859-1', source: 'declaration', confidence: 'medium' };
    }
    if (declaredEncoding === 'us-ascii' || declaredEncoding === 'ascii') {
      return { encoding: 'us-ascii', source: 'declaration', confidence: 'medium' };
    }

    throw new UnsupportedEncodingError(`Unsupported XML encoding: ${declaredEncoding}`);
  }

  public detectFallback(buffer: Buffer): XmlEncodingDetectionResult {
    if (buffer.length === 0) {
      throw new XmlEncodingError('Empty XML document cannot be decoded.');
    }

    const firstBytes = buffer.slice(0, 4);
    const suspicious = firstBytes.some((byte) => byte === 0x00);
    if (suspicious) {
      return { encoding: 'utf-16le', source: 'fallback', confidence: 'low' };
    }

    const sample = buffer.toString('latin1');
    const containsOnlyAscii = /^[\u0000-\u007f]*$/.test(sample);
    if (containsOnlyAscii) {
      return { encoding: 'utf-8', source: 'fallback', confidence: 'low' };
    }

    return { encoding: 'iso-8859-1', source: 'fallback', confidence: 'low' };
  }
}
