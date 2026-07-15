import test from 'node:test';
import assert from 'node:assert/strict';

import { UsersService } from './users.service';

test('UsersService returns a list of users', async () => {
  const prisma = {
    user: {
      findMany: async () => [{ id: 'u1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: new Date() }],
    },
  } as any;

  const service = new UsersService(prisma);
  const users = await service.findAll();
  assert.equal(users.length, 1);
});
