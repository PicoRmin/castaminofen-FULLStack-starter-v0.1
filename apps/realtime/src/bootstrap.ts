import { LoggerService } from './logger.js';
import { RealtimeService } from './realtime-server.js';

export function createRealtimeApp() {
  const logger = new LoggerService();

  const realtime = new RealtimeService(
    {
      port: Number(process.env.REALTIME_PORT ?? 4100),
      host: process.env.REALTIME_HOST ?? '0.0.0.0',
      authToken: process.env.REALTIME_AUTH_TOKEN,
      redisUrl: process.env.REDIS_URL,
      rateLimitWindowMs: Number(process.env.REALTIME_RATE_LIMIT_WINDOW_MS ?? 1000),
      rateLimitMaxRequests: Number(process.env.REALTIME_RATE_LIMIT_MAX_REQUESTS ?? 20),
    },
    logger,
  );

  return realtime;
}
