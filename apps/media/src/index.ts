import { AppBootstrap } from './app';

export { AppBootstrap } from './app';

// TODO: register routes, services, or handlers for the media application.

export const appName = 'media';

const bootstrap = new AppBootstrap(appName);
bootstrap.start();
