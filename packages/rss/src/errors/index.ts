export class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParserError';
  }
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export class DownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DownloadError';
  }
}

export class UnsupportedFeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFeedError';
  }
}

export class InvalidXmlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidXmlError';
  }
}

export class FeedNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedNotFoundError';
  }
}
