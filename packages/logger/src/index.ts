import { PackageConfig, PackageContract } from '@castaminofen/types';

export * from '@castaminofen/types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context: string | undefined;
}

export class LoggerService implements PackageContract {
  constructor(
    public readonly config: PackageConfig,
    private readonly sink: (...args: unknown[]) => void = console.log,
  ) {}

  initialize(): string {
    return `${this.config.name} initialized`;
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: string): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: string): void {
    this.write('error', message, context);
  }

  private write(level: LogLevel, message: string, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ?? undefined,
    };

    this.sink(entry);
  }
}

export const packageMetadata = {
  name: '@castaminofen/logger',
  version: '0.1.0',
  enabled: true,
};
