import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type NotificationChannel = 'in-app' | 'email' | 'push' | 'web-push';

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  webPush: boolean;
}

interface NotificationTemplate {
  name: string;
  subject?: string;
  body: string;
  channel?: NotificationChannel;
}

export interface NotificationQueueItem {
  id: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  attempts: number;
  maxAttempts: number;
  status: 'queued' | 'completed' | 'failed';
  createdAt: string;
}

interface DispatchInput {
  userId: string;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  templateName?: string;
  context?: Record<string, unknown>;
  preferences?: NotificationPreferences;
  retry?: { maxAttempts?: number };
  queue?: boolean;
  scheduledAt?: Date | string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  inApp: true,
  email: true,
  push: true,
  webPush: false,
};

@Injectable()
export class NotificationsService {
  private readonly preferences = new Map<string, NotificationPreferences>();
  private readonly templates = new Map<string, NotificationTemplate>();
  private readonly queueItems: NotificationQueueItem[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, input: DispatchInput) {
    const preferences = input.preferences ?? this.getPreferences(userId);
    const resolvedChannels = (input.channels?.length ? input.channels : ['in-app']).map((channel) =>
      this.normalizeChannel(channel),
    );
    const template = input.templateName
      ? this.renderTemplate(input.templateName, input.context ?? {})
      : null;
    const title = template?.subject ?? input.title;
    const message = template?.body ?? input.message;

    const created = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false,
      },
    });

    const deliveredChannels: NotificationChannel[] = [];
    const skippedChannels: NotificationChannel[] = [];
    const queuedItems: NotificationQueueItem[] = [];

    for (const channel of resolvedChannels) {
      if (!this.shouldDeliver(channel, preferences)) {
        skippedChannels.push(channel);
        continue;
      }

      deliveredChannels.push(channel);
      if (input.queue || input.scheduledAt) {
        const queueItem: NotificationQueueItem = {
          id: `${created.id}:${channel}`,
          notificationId: created.id,
          userId,
          channel,
          attempts: 0,
          maxAttempts: input.retry?.maxAttempts ?? 1,
          status: 'queued',
          createdAt: new Date().toISOString(),
        };
        this.queueItems.push(queueItem);
        queuedItems.push(queueItem);
      }
    }

    if (!input.queue && !input.scheduledAt) {
      await this.processQueue();
    }

    return {
      notification: created,
      deliveredChannels,
      skippedChannels,
      queue: queuedItems,
    };
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAsUnread(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { isRead: false } });
  }

  getPreferences(userId: string): NotificationPreferences {
    return { ...DEFAULT_PREFERENCES, ...this.preferences.get(userId) };
  }

  setPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): NotificationPreferences {
    const resolved = { ...this.getPreferences(userId), ...preferences };
    this.preferences.set(userId, resolved);
    return resolved;
  }

  registerTemplate(template: NotificationTemplate): NotificationTemplate {
    this.templates.set(template.name, template);
    return template;
  }

  renderTemplate(templateName: string, context: Record<string, unknown> = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      return null;
    }

    const render = (value: string) =>
      Object.entries(context).reduce((result, [key, currentValue]) => {
        return result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(currentValue));
      }, value);

    return {
      subject: render(template.subject ?? template.body),
      body: render(template.body),
    };
  }

  async createDigest(userId: string, notificationIds: string[]) {
    const notifications = await this.prisma.notification.findMany({
      where: { id: { in: notificationIds }, userId },
    });

    const digest = await this.prisma.notification.create({
      data: {
        userId,
        title: 'Daily digest',
        message: notifications.map((item) => item.title).join(', '),
        isRead: false,
      },
    });

    return digest;
  }

  async schedule(userId: string, input: DispatchInput) {
    return this.create(userId, {
      ...input,
      queue: true,
      scheduledAt: input.scheduledAt ?? new Date(Date.now() + 60_000),
    });
  }

  async processQueue() {
    const pending = this.queueItems.filter((item) => item.status === 'queued');

    for (const item of pending) {
      item.attempts += 1;
      if (item.attempts <= item.maxAttempts) {
        item.status = 'completed';
      } else {
        item.status = 'failed';
      }
    }

    return this.queueItems.filter((item) => item.status === 'queued');
  }

  private shouldDeliver(
    channel: NotificationChannel,
    preferences: NotificationPreferences,
  ): boolean {
    switch (channel) {
      case 'in-app':
        return preferences.inApp;
      case 'email':
        return preferences.email;
      case 'push':
        return preferences.push;
      case 'web-push':
        return preferences.webPush;
      default:
        return false;
    }
  }

  private normalizeChannel(channel: NotificationChannel | string): NotificationChannel {
    switch (channel.toLowerCase()) {
      case 'webpush':
      case 'web-push':
      case 'web_push':
        return 'web-push';
      case 'inapp':
      case 'in-app':
        return 'in-app';
      case 'email':
        return 'email';
      case 'push':
        return 'push';
      default:
        return 'in-app';
    }
  }
}
