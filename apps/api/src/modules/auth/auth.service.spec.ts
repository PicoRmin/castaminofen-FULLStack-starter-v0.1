import test from 'node:test';
import assert from 'node:assert/strict';

import { AuthService } from './auth.service';

test('AuthService registers a user', async () => {
  const prisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'u1',
        ...data,
        role: 'user',
      }),
    },
  } as any;

  const service = new AuthService(prisma as any, { require: () => 'test-secret' } as any);
  const res = await service.register({ email: 'test@example.com', password: 'password123' });
  assert.equal(res.user.email, 'test@example.com');
  assert.ok(res.accessToken);
});
