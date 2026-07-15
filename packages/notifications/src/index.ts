import { randomUUID } from 'node:crypto';

import {
  type DeliveryEvent,
  type DispatchInput,
  type DispatchResult,
  type NotificationChannel,
  type NotificationPreferences,
  type NotificationQueueItem,
  type NotificationRecord,
  type NotificationTemplate,
  PackageConfig,
  PackageContract,
} from './types';

export * from './types';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  inApp: true,
  email: true,
  push: true,
  webPush: false,
};

export class NotificationsService implements PackageContract {
  private readonly inbox = new Map<string, NotificationRecord[]>();

  private readonly preferences = new Map<
    string,
    NotificationPreferences
  >();

  private readonly templates = new Map<
    string,
    NotificationTemplate
  >();

  private readonly queueItems: NotificationQueueItem[] = [];

  private readonly deliveryListeners: Array<
    (event: DeliveryEvent) => void
  > = [];

  private readonly digests = new Map<
    string,
    NotificationRecord[]
  >();

  constructor(public readonly config: PackageConfig) {}

  initialize(): string {
    return `${this.config.name} initialized`;
  }

  onDelivery(
    listener: (event: DeliveryEvent) => void,
  ): () => void {
    this.deliveryListeners.push(listener);

    return () => {
      const index = this.deliveryListeners.indexOf(listener);

      if (index >= 0) {
        this.deliveryListeners.splice(index, 1);
      }
    };
  }

  setPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): NotificationPreferences {
    const resolved: NotificationPreferences = {
      ...this.getPreferences(userId),
      ...preferences,
    };

    this.preferences.set(userId, resolved);

    return resolved;
  }

  getPreferences(
    userId: string,
  ): NotificationPreferences {
    return {
      ...DEFAULT_PREFERENCES,
      ...this.preferences.get(userId),
    };
  }

  registerTemplate(
    template: NotificationTemplate,
  ): NotificationTemplate {
    this.templates.set(template.name, template);

    return template;
  }

  renderTemplate(
    templateName: string,
    context: Record<string, unknown> = {},
  ): {
    subject: string;
    body: string;
  } | null {
    const template = this.templates.get(templateName);

    if (!template) {
      return null;
    }

    const render = (value: string): string =>
      Object.entries(context).reduce(
        (result, [key, currentValue]) =>
          result.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            String(currentValue),
          ),
        value,
      );

    return {
      subject: render(template.subject ?? template.body),
      body: render(template.body),
    };
  }


  async dispatch(input: DispatchInput): Promise<DispatchResult> {
	const requestedChannels = (
		input.channels?.length
			? input.channels
			: ['in-app']
	).map((channel) => this.normalizeChannel(channel));

	const preferences =
		input.preferences ??
		this.getPreferences(input.userId);

	const template = input.templateName
		? this.renderTemplate(
			input.templateName,
			input.context ?? {},
		)
		: null;

	const title = template?.subject ?? input.title;
	const message = template?.body ?? input.message;

	const notification: NotificationRecord = {
		id: randomUUID(),
		userId: input.userId,
		title,
		message,
		channels: requestedChannels,
		isRead: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),

		...(input.templateName !== undefined && {
			templateName: input.templateName,
		}),

		...(input.metadata !== undefined && {
			metadata: input.metadata,
		}),
	};

	this.addToInbox(notification);

	const deliveredChannels: NotificationChannel[] = [];
	const skippedChannels: NotificationChannel[] = [];
	const queuedChannels: NotificationQueueItem[] = [];

	const scheduledAt = this.toIsoDate(
		input.scheduledAt,
	);

	for (const channel of requestedChannels) {
		if (!this.shouldDeliver(channel, preferences)) {
			skippedChannels.push(channel);

			this.emitDelivery({
				notification,
				channel,
				status: 'skipped',
			});

			continue;
		}

		deliveredChannels.push(channel);

		const item: NotificationQueueItem = {
			id: randomUUID(),
			notificationId: notification.id,
			userId: notification.userId,
			channel,
			attempts: 0,
			maxAttempts: 3,
			status: 'queued',
			createdAt: new Date().toISOString(),

			...(scheduledAt !== undefined && {
				scheduledAt,
			}),
		};

		this.queueItems.push(item);
		queuedChannels.push(item);

		if (input.queue || scheduledAt) {
			this.emitDelivery({
				notification,
				channel,
				status: 'queued',
			});
		}
	}

	if (!input.queue && !scheduledAt) {
		await this.processQueue();
	}

	return {
		notification,
		deliveredChannels,
		skippedChannels,
		queue: queuedChannels,
	};
}

  async markAsRead(userId: string, notificationId: string): Promise<NotificationRecord | null> {
    const inbox = this.inbox.get(userId) ?? [];
    const target = inbox.find((item) => item.id === notificationId);
    if (!target) {
      return null;
    }

    const updated: NotificationRecord = {
      ...target,
      isRead: true,
      updatedAt: new Date().toISOString(),
    };

    this.inbox.set(
      userId,
      inbox.map((item) => (item.id === notificationId ? updated : item)),
    );
    return updated;
  }

  async getInbox(userId: string): Promise<NotificationRecord[]> {
    return [...(this.inbox.get(userId) ?? [])].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  async createDigest(
    userId: string,
    notifications: NotificationRecord[],
  ): Promise<NotificationRecord> {
    const digest = {
      id: randomUUID(),
      userId,
      title: 'Daily digest',
      message: notifications.map((item) => item.title).join(', '),
      channels: ['in-app'],
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { type: 'digest' },
    } satisfies NotificationRecord;

    this.addToInbox(digest);
    this.digests.set(userId, notifications);
    return digest;
  }

  async schedule(input: DispatchInput): Promise<DispatchResult> {
    return this.dispatch({
      ...input,
      queue: true,
      scheduledAt: input.scheduledAt ?? new Date(Date.now() + 60_000),
    });
  }

  async processQueue(): Promise<NotificationQueueItem[]> {
    const pending = this.queueItems.filter((item) => item.status === 'queued');
    for (const item of pending) {
      await this.deliverQueueItem(item);
    }
    return this.queueItems.filter((entry) => entry.status === 'queued');
  }

  private addToInbox(notification: NotificationRecord): void {
    const inbox = this.inbox.get(notification.userId) ?? [];
    this.inbox.set(notification.userId, [notification, ...inbox]);
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

  private toIsoDate(value?: Date | string): string | undefined {
    if (!value) {
      return undefined;
    }
    return value instanceof Date ? value.toISOString() : value;
  }

  private async deliverQueueItem(item: NotificationQueueItem): Promise<void> {
    const notification = this.inbox
      .get(item.userId)
      ?.find((value) => value.id === item.notificationId);
    if (!notification) {
      item.status = 'failed';
      return;
    }

    item.attempts += 1;
    if (item.attempts <= item.maxAttempts) {
      item.status = 'completed';
      this.emitDelivery({ notification, channel: item.channel, status: 'delivered' });
      return;
    }

    item.status = 'failed';
    this.emitDelivery({
      notification,
      channel: item.channel,
      status: 'failed',
      error: 'Max attempts reached',
    });
  }

  private emitDelivery(event: DeliveryEvent): void {
    for (const listener of this.deliveryListeners) {
      listener(event);
    }
  }
}

export const packageMetadata = {
  name: '@castaminofen/notifications',
  version: '0.1.0',
  enabled: true,
};
