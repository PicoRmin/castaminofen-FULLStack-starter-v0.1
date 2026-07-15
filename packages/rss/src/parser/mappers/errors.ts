export class DtoMappingError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DtoMappingError';
  }
}

export class NormalizationError extends DtoMappingError {}
