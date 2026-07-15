import { AppBootstrap } from './app';

export { AppBootstrap } from './app';

export const appName = 'api';

const bootstrap = new AppBootstrap(appName);
bootstrap.start();
