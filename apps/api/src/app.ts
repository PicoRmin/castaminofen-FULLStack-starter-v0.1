import { CoreService } from '../../../packages/core/src/index';
import { ConfigService as SharedConfigService } from '../../../packages/config/src/index';
import { LoggerService } from '../../../packages/logger/src/index';

export interface AppContract {
  readonly name: string;
  start(): string;
}

export class AppBootstrap implements AppContract {
  constructor(public readonly name: string) {}

  start(): string {
    const core = new CoreService({
      name: '@castaminofen/core',
      version: '0.1.0',
      enabled: true,
    });

    const config = new SharedConfigService({
      name: '@castaminofen/config',
      version: '0.1.0',
      enabled: true,
    });

    const logger = new LoggerService({
      name: '@castaminofen/logger',
      version: '0.1.0',
      enabled: true,
    });

    const runtimeConfig = config.getRuntimeConfig();
    logger.info(`Starting ${this.name}`, JSON.stringify(runtimeConfig));

    return `${this.name} started via ${core.initialize()} on ${runtimeConfig.port}`;
  }
}
