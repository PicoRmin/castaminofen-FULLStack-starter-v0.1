import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server, type Socket } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { LoggerService } from './logger.js';
import { InMemoryRateLimiter } from './rate-limiter.js';

interface RealtimeSocket extends Socket {
  data: {
    userId?: string;
    sessionId?: string;
    rooms?: string[];
  };
}

interface RealtimeConfig {
  readonly port: number;
  readonly host: string;
  readonly authToken?: string | undefined;
  readonly redisUrl?: string | undefined;
  readonly rateLimitWindowMs: number;
  readonly rateLimitMaxRequests: number;
}

interface PresenceSnapshot {
  readonly roomId: string;
  readonly users: readonly string[];
}

export class RealtimeService {
  private readonly httpServer: HttpServer;
  private readonly io: Server;
  private readonly limiter: InMemoryRateLimiter;
  private readonly recoveryStore = new Map<string, { userId: string; rooms: string[] }>();

  constructor(
    private readonly config: RealtimeConfig,
    private readonly logger: LoggerService = new LoggerService(),
  ) {
    this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });
    this.limiter = new InMemoryRateLimiter({
      windowMs: this.config.rateLimitWindowMs,
      maxRequests: this.config.rateLimitMaxRequests,
    });
    this.configure();
  }

  start(): string {
    this.httpServer.listen(this.config.port, this.config.host, () => {
      this.logger.info(
        `Realtime service listening on http://${this.config.host}:${this.config.port}`,
        'realtime',
      );
    });

    void this.attachRedisAdapter();

    return `Realtime service listening on ${this.config.host}:${this.config.port}`;
  }

  private configure(): void {
    this.io.use((socket, next) => this.authenticateSocket(socket, next));

    this.io.on('connection', (socket) => {
      const socketWithData = socket as RealtimeSocket;
      const userId = this.resolveUserId(socketWithData);
      const sessionId = (socket.handshake.auth?.sessionId as string | undefined) ?? randomUUID();
      socketWithData.data.userId = userId;
      socketWithData.data.sessionId = sessionId;
      socketWithData.data.rooms = [];

      void socket.join(`user:${userId}`);

      socket.emit('connection:ready', {
        sessionId,
        userId,
        features: [
          'websocket',
          'socket.io',
          'redis-pubsub',
          'presence',
          'notifications',
          'listening',
          'comments',
          'typing-indicators',
          'recovery',
          'authentication',
          'rate-limiting',
        ],
      });

      socket.on('join-room', (roomId: string) => void this.handleJoinRoom(socketWithData, roomId));
      socket.on(
        'leave-room',
        (roomId: string) => void this.handleLeaveRoom(socketWithData, roomId),
      );
      socket.on(
        'notification:send',
        (payload: { toUserId?: string; roomId?: string; title: string; message: string }) =>
          void this.handleNotification(socketWithData, payload),
      );
      socket.on(
        'listening:track',
        (payload: { episodeId: string; podcastId: string; title: string }) =>
          void this.handleListening(socketWithData, payload),
      );
      socket.on(
        'comment:create',
        (payload: { roomId: string; body: string }) =>
          void this.handleComment(socketWithData, payload),
      );
      socket.on(
        'typing:start',
        (roomId: string) => void this.handleTypingStart(socketWithData, roomId),
      );
      socket.on(
        'typing:stop',
        (roomId: string) => void this.handleTypingStop(socketWithData, roomId),
      );
      socket.on('recovery:resume', (payload?: { sessionId?: string }) =>
        this.handleRecoveryResume(socketWithData, payload),
      );
      socket.on('disconnect', () => this.handleDisconnect(socketWithData));
    });
  }

  private authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
    const expectedToken = this.config.authToken;
    const authHeader = socket.handshake.headers.authorization as string | undefined;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const authToken = (socket.handshake.auth?.token as string | undefined) ?? headerToken;

    if (expectedToken && authToken !== expectedToken) {
      this.logger.warn('Rejected unauthenticated realtime socket', 'realtime');
      next(new Error('Unauthorized'));
      return;
    }

    next();
  }

  private resolveUserId(socket: RealtimeSocket): string {
    const handshakeUserId = socket.handshake.auth?.userId as string | undefined;
    const queryUserId = socket.handshake.query.userId as string | undefined;
    return handshakeUserId ?? queryUserId ?? `user-${socket.id}`;
  }

  private async attachRedisAdapter(): Promise<void> {
    if (!this.config.redisUrl) {
      this.logger.info('Redis adapter disabled; using in-memory transport', 'realtime');
      return;
    }

    try {
      const pubClient = new Redis(this.config.redisUrl, { lazyConnect: true });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.io.adapter(createAdapter(pubClient, subClient));
      this.logger.info('Redis adapter enabled for horizontal scaling', 'realtime');
    } catch (error) {
      this.logger.error(
        `Redis adapter initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        'realtime',
      );
    }
  }

  private checkRateLimit(socket: RealtimeSocket): boolean {
    const userId = socket.data.userId ?? socket.id;
    const allowed = this.limiter.allow(userId);
    if (!allowed) {
      socket.emit('error', {
        code: 'rate_limit_exceeded',
        message: 'Too many realtime requests. Please slow down.',
      });
      return false;
    }
    return true;
  }

  private async handleJoinRoom(socket: RealtimeSocket, roomId: string): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    await socket.join(roomId);
    const rooms = socket.data.rooms ?? [];
    if (!rooms.includes(roomId)) {
      rooms.push(roomId);
      socket.data.rooms = rooms;
    }

    await this.broadcastPresence(roomId);
    socket.emit('room:joined', { roomId, sessionId: socket.data.sessionId });
  }

  private async handleLeaveRoom(socket: RealtimeSocket, roomId: string): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    await socket.leave(roomId);
    const rooms = socket.data.rooms ?? [];
    socket.data.rooms = rooms.filter((entry) => entry !== roomId);
    await this.broadcastPresence(roomId);
    socket.emit('room:left', { roomId });
  }

  private async handleNotification(
    socket: RealtimeSocket,
    payload: { toUserId?: string; roomId?: string; title: string; message: string },
  ): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    const event = {
      id: randomUUID(),
      title: payload.title,
      message: payload.message,
      createdAt: new Date().toISOString(),
      senderId: socket.data.userId,
    };

    if (payload.toUserId) {
      this.io.to(`user:${payload.toUserId}`).emit('notification:new', event);
    } else if (payload.roomId) {
      this.io.to(payload.roomId).emit('notification:new', event);
    } else {
      this.io.emit('notification:new', event);
    }
  }

  private async handleListening(
    socket: RealtimeSocket,
    payload: { episodeId: string; podcastId: string; title: string },
  ): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    const event = {
      episodeId: payload.episodeId,
      podcastId: payload.podcastId,
      title: payload.title,
      userId: socket.data.userId,
      timestamp: new Date().toISOString(),
    };

    this.io.to(`episode:${payload.episodeId}`).emit('listening:update', event);
  }

  private async handleComment(
    socket: RealtimeSocket,
    payload: { roomId: string; body: string },
  ): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    const event = {
      id: randomUUID(),
      roomId: payload.roomId,
      body: payload.body,
      userId: socket.data.userId,
      createdAt: new Date().toISOString(),
    };

    this.io.to(payload.roomId).emit('comment:new', event);
  }

  private async handleTypingStart(socket: RealtimeSocket, roomId: string): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    const typers = new Set<string>();
    const existing = this.io.sockets.adapter.rooms.get(`typing:${roomId}`) ?? new Set<string>();
    existing.add(socket.id);
    this.io.sockets.adapter.rooms.set(`typing:${roomId}`, existing);
    this.io.to(roomId).emit('typing:update', { roomId, users: this.getTypingUsers(roomId) });
  }

  private async handleTypingStop(socket: RealtimeSocket, roomId: string): Promise<void> {
    if (!this.checkRateLimit(socket)) {
      return;
    }

    const existing = this.io.sockets.adapter.rooms.get(`typing:${roomId}`) ?? new Set<string>();
    existing.delete(socket.id);
    this.io.sockets.adapter.rooms.set(`typing:${roomId}`, existing);
    this.io.to(roomId).emit('typing:update', { roomId, users: this.getTypingUsers(roomId) });
  }

  private handleRecoveryResume(socket: RealtimeSocket, payload?: { sessionId?: string }): void {
    const sessionId = payload?.sessionId ?? socket.data.sessionId;
    if (!sessionId) {
      return;
    }

    const recovered = this.recoveryStore.get(sessionId);
    if (!recovered) {
      socket.emit('recovery:restored', { sessionId, rooms: [] });
      return;
    }

    for (const roomId of recovered.rooms) {
      void socket.join(roomId);
    }

    this.recoveryStore.delete(sessionId);
    socket.emit('recovery:restored', { sessionId, rooms: recovered.rooms });
  }

  private handleDisconnect(socket: RealtimeSocket): void {
    const sessionId = socket.data.sessionId;
    if (sessionId) {
      this.recoveryStore.set(sessionId, {
        userId: socket.data.userId ?? socket.id,
        rooms: socket.data.rooms ?? [],
      });
    }

    void this.cleanupTypingState(socket);
  }

  private async cleanupTypingState(socket: RealtimeSocket): Promise<void> {
    const rooms = socket.data.rooms ?? [];
    for (const roomId of rooms) {
      const existing = this.io.sockets.adapter.rooms.get(`typing:${roomId}`) ?? new Set<string>();
      existing.delete(socket.id);
      this.io.sockets.adapter.rooms.set(`typing:${roomId}`, existing);
      this.io.to(roomId).emit('typing:update', { roomId, users: this.getTypingUsers(roomId) });
    }
  }

  private async broadcastPresence(roomId: string): Promise<void> {
    const sockets = await this.io.in(roomId).fetchSockets();
    const users = sockets
      .map((socket) => (socket as unknown as RealtimeSocket).data.userId)
      .filter((value): value is string => Boolean(value));
    const snapshot: PresenceSnapshot = { roomId, users };
    this.io.to(roomId).emit('presence:update', snapshot);
  }

  private getTypingUsers(roomId: string): string[] {
    const sockets = this.io.sockets.adapter.rooms.get(`typing:${roomId}`) ?? new Set<string>();
    return Array.from(sockets).map((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      return (socket as RealtimeSocket | undefined)?.data.userId ?? socketId;
    });
  }
}
