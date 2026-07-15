import {
  MalformedDocumentError,
  UnsupportedEncodingError,
  XmlEncodingError,
  XmlSyntaxError,
  XmlValidationError,
  type XmlErrorDetails,
} from './errors';

export class XmlErrorFactory {
  public static syntax(message: string, details: Record<string, unknown> = {}) {
    const payload = this.createDetails(details);
    return new XmlSyntaxError(message, payload);
  }

  public static encoding(message: string, details: Record<string, unknown> = {}) {
    const payload = this.createDetails(details);
    return new XmlEncodingError(message, payload);
  }

  public static validation(message: string, details: Record<string, unknown> = {}) {
    const payload = this.createDetails(details);
    return new XmlValidationError(message, payload);
  }

  public static unsupportedEncoding(message: string, details: Record<string, unknown> = {}) {
    const payload = this.createDetails(details);
    return new UnsupportedEncodingError(message, payload);
  }

  public static malformedDocument(message: string, details: Record<string, unknown> = {}) {
    const payload = this.createDetails(details);
    return new MalformedDocumentError(message, payload);
  }

  private static createDetails(details: Record<string, unknown>): XmlErrorDetails {
    const payload: XmlErrorDetails = {};
    if (typeof details.line === 'number') {
      payload.line = details.line;
    }
    if (typeof details.column === 'number') {
      payload.column = details.column;
    }
    if (typeof details.position === 'number') {
      payload.position = details.position;
    }
    if (typeof details.contextSnippet === 'string') {
      payload.contextSnippet = details.contextSnippet;
    }
    if (details.cause !== undefined) {
      payload.cause = details.cause;
    }
    return payload;
  }
}
