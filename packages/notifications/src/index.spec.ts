import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationsService } from './index.js';

test('dispatches in-app notifications and marks them read', async () => {
  const service = new NotificationsService({
    name: '@castaminofen/notifications',
    version: '0.1.0',
    enabled: true,
  });

  const deliveries: string[] = [];
  service.onDelivery((event) => {
    deliveries.push(`${event.channel}:${event.notification.title}`);
  });

  const result = await service.dispatch({
    userId: 'user-1',
    title: 'New episode available',
    message: 'A fresh episode is ready.',
    channels: ['in-app'],
  });

  assert.equal(result.notification.isRead, false);
  assert.deepEqual(deliveries, ['in-app:New episode available']);

  await service.markAsRead('user-1', result.notification.id);
  const inbox = await service.getInbox('user-1');
  assert.equal(inbox[0]?.isRead, true);
});

test('respects channel preferences and retries failed deliveries', async () => {
  const service = new NotificationsService({
    name: '@castaminofen/notifications',
    version: '0.1.0',
    enabled: true,
  });

  service.setPreferences('user-2', {
    inApp: true,
    email: false,
    push: false,
    webPush: false,
  });

  const result = await service.dispatch({
    userId: 'user-2',
    title: 'Weekly digest',
    message: 'Your weekly update is ready.',
    channels: ['email', 'push', 'in-app'],
    retry: { maxAttempts: 2 },
    queue: true,
  });

  assert.equal(result.deliveredChannels.includes('in-app'), true);
  assert.equal(result.skippedChannels.includes('email'), true);
  assert.equal(result.skippedChannels.includes('push'), true);
  assert.equal(result.queue.length, 1);

  const pending = await service.processQueue();
  assert.equal(pending.length, 0);
});
