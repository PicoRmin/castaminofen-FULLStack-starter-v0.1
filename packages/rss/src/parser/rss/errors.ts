export type RssParserErrorCode =
  | 'INVALID_RSS_DOCUMENT'
  | 'UNSUPPORTED_VERSION'
  | 'CHANNEL_VALIDATION_ERROR'
  | 'ITEM_VALIDATION_ERROR'
  | 'ENCLOSURE_VALIDATION_ERROR';

export interface RssParserErrorDetails {
  readonly stage: string;
  readonly location?: string;
  readonly context?: Record<string, unknown>;
}

export class RssParserError extends Error {
  public readonly code: RssParserErrorCode;
  public readonly stage: string;
  public readonly location: string | undefined;
  public readonly context: Record<string, unknown> | undefined;

  constructor(code: RssParserErrorCode, message: string, details: RssParserErrorDetails) {
    super(message);
    this.name = 'RssParserError';
    this.code = code;
    this.stage = details.stage;
    this.location = details.location;
    this.context = details.context;
  }
}

export class InvalidRssDocumentError extends RssParserError {
  constructor(message: string, details: RssParserErrorDetails) {
    super('INVALID_RSS_DOCUMENT', message, details);
    this.name = 'InvalidRssDocumentError';
  }
}

export class UnsupportedVersionError extends RssParserError {
  constructor(message: string, details: RssParserErrorDetails) {
    super('UNSUPPORTED_VERSION', message, details);
    this.name = 'UnsupportedVersionError';
  }
}

export class ChannelValidationError extends RssParserError {
  constructor(message: string, details: RssParserErrorDetails) {
    super('CHANNEL_VALIDATION_ERROR', message, details);
    this.name = 'ChannelValidationError';
  }
}

export class ItemValidationError extends RssParserError {
  constructor(message: string, details: RssParserErrorDetails) {
    super('ITEM_VALIDATION_ERROR', message, details);
    this.name = 'ItemValidationError';
  }
}

export class EnclosureValidationError extends RssParserError {
  constructor(message: string, details: RssParserErrorDetails) {
    super('ENCLOSURE_VALIDATION_ERROR', message, details);
    this.name = 'EnclosureValidationError';
  }
}
