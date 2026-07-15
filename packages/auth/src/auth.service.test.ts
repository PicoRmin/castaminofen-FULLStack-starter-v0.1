import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthService, InMemoryUserRepository } from './index';

test('register creates a user and returns a session token', async () => {
  const service = new AuthService(new InMemoryUserRepository());

  const result = await service.register({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'StrongPass123!',
  });

  assert.equal(result.user.email, 'ada@example.com');
  assert.equal(result.user.name, 'Ada Lovelace');
  assert.ok(result.session.token.length > 20);
  assert.equal(result.session.userId, result.user.id);
});

test('login rejects invalid credentials', async () => {
  const service = new AuthService(new InMemoryUserRepository());

  await service.register({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'StrongPass123!',
  });

  await assert.rejects(
    () =>
      service.login({
        email: 'grace@example.com',
        password: 'WrongPassword123!',
      }),
    /invalid credentials/i,
  );
});
