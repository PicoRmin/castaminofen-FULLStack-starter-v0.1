export class NamespaceResolutionError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'NamespaceResolutionError';
  }
}

export class NamespaceConflictError extends NamespaceResolutionError {}
export class UnknownNamespaceError extends NamespaceResolutionError {}
