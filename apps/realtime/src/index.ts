import { createRealtimeApp } from './bootstrap.js';

export { createRealtimeApp } from './bootstrap.js';

export const appName = 'realtime';

const realtime = createRealtimeApp();
realtime.start();
