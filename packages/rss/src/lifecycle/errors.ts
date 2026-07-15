export class FeedLifecycleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'FeedLifecycleError';
  }
}

export class InvalidStateTransitionError extends FeedLifecycleError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'invalid-state-transition', details);
    this.name = 'InvalidStateTransitionError';
  }
}

export class FeedValidationRequiredError extends FeedLifecycleError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'feed-validation-required', details);
    this.name = 'FeedValidationRequiredError';
  }
}

export class FeedLifecycleViolationError extends FeedLifecycleError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'feed-lifecycle-violation', details);
    this.name = 'FeedLifecycleViolationError';
  }
}
