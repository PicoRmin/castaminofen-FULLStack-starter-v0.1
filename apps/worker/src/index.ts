import { AppBootstrap } from './app.js';

export { AppBootstrap } from './app.js';

export const appName = 'worker';

const bootstrap = new AppBootstrap(appName);

void bootstrap.start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Worker failed to start: ${message}`);
  process.exitCode = 1;
});
