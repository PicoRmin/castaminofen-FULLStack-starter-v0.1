export interface AppContract {
  readonly name: string;
  start(): string;
}

export class AppBootstrap implements AppContract {
  constructor(public readonly name: string) {}

  start(): string {
    return `${this.name} started`;
  }
}
