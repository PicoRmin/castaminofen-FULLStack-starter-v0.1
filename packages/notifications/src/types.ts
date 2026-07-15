export interface PackageConfig {
  readonly name: string;
  readonly version: string;
  readonly enabled: boolean;
}

export interface PackageContract {
  readonly config: PackageConfig;
  initialize(): string;
}

export type NotificationChannel = 'in-app' | 'email' | 'push' | 'web-push';

export interface NotificationPreferences {
  readonly inApp: boolean;
  readonly email: boolean;
  readonly push: boolean;
  readonly webPush: boolean;
}

export interface NotificationTemplate {
  readonly name: string;
  readonly subject?: string;
  readonly body: string;
  readonly channel?: NotificationChannel;
}

export interface NotificationRecord {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly message: string;
  readonly channels: readonly NotificationChannel[];
  readonly isRead: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly templateName?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface NotificationQueueItem {
  readonly id: string;
  readonly notificationId: string;
  readonly userId: string;
  readonly channel: NotificationChannel;
  attempts: number;
  maxAttempts: number;
  status: 'queued' | 'completed' | 'failed';
  scheduledAt?: string;
  createdAt: string;
}

export interface DispatchInput {
  readonly userId: string;
  readonly title: string;
  readonly message: string;
  readonly channels?: readonly NotificationChannel[];
  readonly templateName?: string;
  readonly context?: Record<string, unknown>;
  readonly preferences?: NotificationPreferences;
  readonly retry?: { readonly maxAttempts?: number };
  readonly queue?: boolean;
  readonly scheduledAt?: Date | string;
  readonly metadata?: Record<string, unknown>;
}

export interface DispatchResult {
  readonly notification: NotificationRecord;
  readonly deliveredChannels: NotificationChannel[];
  readonly skippedChannels: NotificationChannel[];
  readonly queue: NotificationQueueItem[];
}

export interface DeliveryEvent {
  readonly notification: NotificationRecord;
  readonly channel: NotificationChannel;
  readonly status: 'delivered' | 'skipped' | 'queued' | 'failed';
  readonly error?: string;
}
