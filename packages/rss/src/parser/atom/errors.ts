import type { XmlError } from '../xml/errors';
import type { AtomParserIssueDto } from './dto';

export type AtomParserErrorCode =
  | 'INVALID_ATOM_DOCUMENT'
  | 'UNSUPPORTED_ATOM_DOCUMENT'
  | 'FEED_VALIDATION_ERROR'
  | 'ENTRY_VALIDATION_ERROR'
  | 'CONTENT_VALIDATION_ERROR'
  | 'LINK_VALIDATION_ERROR'
  | 'NAMESPACE_VALIDATION_ERROR';

export interface AtomParserErrorDetails {
  stage: string;
  line?: number;
  column?: number;
  context?: Record<string, unknown>;
}

export class AtomParserError extends Error {
  public readonly code: AtomParserErrorCode;
  public readonly stage: string;
  public readonly line?: number | undefined;
  public readonly column?: number | undefined;
  public readonly context?: Record<string, unknown> | undefined;

  constructor(code: AtomParserErrorCode, message: string, details: AtomParserErrorDetails) {
    super(message);
    this.name = 'AtomParserError';
    this.code = code;
    this.stage = details.stage;
    this.line = details.line;
    this.column = details.column;
    this.context = details.context;
  }
}

export class InvalidAtomDocumentError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('INVALID_ATOM_DOCUMENT', message, details);
    this.name = 'InvalidAtomDocumentError';
  }
}

export class UnsupportedAtomVersionError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('UNSUPPORTED_ATOM_DOCUMENT', message, details);
    this.name = 'UnsupportedAtomVersionError';
  }
}

export class FeedValidationError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('FEED_VALIDATION_ERROR', message, details);
    this.name = 'FeedValidationError';
  }
}

export class EntryValidationError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('ENTRY_VALIDATION_ERROR', message, details);
    this.name = 'EntryValidationError';
  }
}

export class ContentValidationError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('CONTENT_VALIDATION_ERROR', message, details);
    this.name = 'ContentValidationError';
  }
}

export class LinkValidationError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('LINK_VALIDATION_ERROR', message, details);
    this.name = 'LinkValidationError';
  }
}

export class NamespaceValidationError extends AtomParserError {
  constructor(message: string, details: AtomParserErrorDetails) {
    super('NAMESPACE_VALIDATION_ERROR', message, details);
    this.name = 'NamespaceValidationError';
  }
}
