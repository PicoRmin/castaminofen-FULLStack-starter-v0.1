export class QueueError extends Error {
  public constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = 'QueueError';
  }
}

export class QueueAdapterError extends QueueError {
  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'QueueAdapterError';
  }
}

export class QueueConnectionError extends QueueAdapterError {
  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'QueueConnectionError';
  }
}

export class JobSerializationError extends QueueAdapterError {
  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'JobSerializationError';
  }
}

export class JobValidationError extends QueueError {
  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'JobValidationError';
  }
}

export class QueueConfigurationError extends QueueError {
  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'QueueConfigurationError';
  }
}
