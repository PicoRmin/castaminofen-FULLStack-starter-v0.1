export class LoggerService {
  constructor(private readonly context = 'realtime') {}

  info(message: string, context?: string): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: string): void {
    this.write('error', message, context);
  }

  private write(level: 'info' | 'warn' | 'error', message: string, context?: string): void {
    console.log(
      JSON.stringify({
        level,
        context: context ?? this.context,
        message,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
