import { AppBootstrap } from './app';

export { AppBootstrap } from './app';

// TODO: register routes, services, or handlers for the docs application.

export const appName = 'docs';

const bootstrap = new AppBootstrap(appName);
bootstrap.start();
