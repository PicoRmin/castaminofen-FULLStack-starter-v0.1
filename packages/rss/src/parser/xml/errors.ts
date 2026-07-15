export type XmlErrorCode =
  | 'XML_SYNTAX_ERROR'
  | 'XML_ENCODING_ERROR'
  | 'XML_VALIDATION_ERROR'
  | 'UNSUPPORTED_ENCODING_ERROR'
  | 'MALFORMED_DOCUMENT_ERROR';

export interface XmlErrorDetails {
  line?: number;
  column?: number;
  position?: number;
  contextSnippet?: string;
  cause?: unknown;
}

export class XmlError extends Error {
  public readonly code: XmlErrorCode;
  public readonly line: number | undefined;
  public readonly column: number | undefined;
  public readonly position: number | undefined;
  public readonly contextSnippet: string | undefined;
  public readonly cause: unknown;

  constructor(code: XmlErrorCode, message: string, details: XmlErrorDetails = {}) {
    super(message);
    this.name = 'XmlError';
    this.code = code;
    this.line = details.line;
    this.column = details.column;
    this.position = details.position;
    this.contextSnippet = details.contextSnippet;
    this.cause = details.cause;
  }
}

export class XmlSyntaxError extends XmlError {
  constructor(message: string, details: XmlErrorDetails = {}) {
    super('XML_SYNTAX_ERROR', message, details);
    this.name = 'XmlSyntaxError';
  }
}

export class XmlEncodingError extends XmlError {
  constructor(message: string, details: XmlErrorDetails = {}) {
    super('XML_ENCODING_ERROR', message, details);
    this.name = 'XmlEncodingError';
  }
}

export class XmlValidationError extends XmlError {
  constructor(message: string, details: XmlErrorDetails = {}) {
    super('XML_VALIDATION_ERROR', message, details);
    this.name = 'XmlValidationError';
  }
}

export class UnsupportedEncodingError extends XmlError {
  constructor(message: string, details: XmlErrorDetails = {}) {
    super('UNSUPPORTED_ENCODING_ERROR', message, details);
    this.name = 'UnsupportedEncodingError';
  }
}

export class MalformedDocumentError extends XmlError {
  constructor(message: string, details: XmlErrorDetails = {}) {
    super('MALFORMED_DOCUMENT_ERROR', message, details);
    this.name = 'MalformedDocumentError';
  }
}
