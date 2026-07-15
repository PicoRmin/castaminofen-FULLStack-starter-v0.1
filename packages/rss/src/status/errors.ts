export class UnknownFeedStatusError extends Error {
  constructor(status: string) {
    super(`Unknown feed status: ${status}`);
    this.name = 'UnknownFeedStatusError';
  }
}

export class InvalidFeedStatusError extends Error {
  constructor(status: string) {
    super(`Invalid feed status: ${status}`);
    this.name = 'InvalidFeedStatusError';
  }
}

export class UnsupportedFeedStatusError extends Error {
  constructor(status: string) {
    super(`Unsupported feed status: ${status}`);
    this.name = 'UnsupportedFeedStatusError';
  }
}
