export class TestLifecycleReporter {
  private readonly events: Array<{ type: string; message: string; metadata?: Record<string, unknown>; timestamp: number }> = [];

  public record(type: string, message: string, metadata?: Record<string, unknown>): void {
    this.events.push({ type, message, metadata, timestamp: Date.now() });
  }

  public snapshot(): readonly Array<{ type: string; message: string; metadata?: Record<string, unknown>; timestamp: number }> {
    return [...this.events];
  }
}
