export interface AppContract {
  readonly name: string;
  start(): string;
}

export class AppBootstrap implements AppContract {
  constructor(public readonly name: string) {}

  start(): string {
    // TODO: wire app-specific startup flow here.
    return `${this.name} started`;
  }
}
