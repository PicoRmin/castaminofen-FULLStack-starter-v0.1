import { AppBootstrap } from './app';

export { AppBootstrap } from './app';

// TODO: register routes, services, or handlers for the web application.

export const appName = 'web';

const bootstrap = new AppBootstrap(appName);
bootstrap.start();
