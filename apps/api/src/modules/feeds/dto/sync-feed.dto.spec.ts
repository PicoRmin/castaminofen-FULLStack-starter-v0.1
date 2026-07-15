import assert from 'node:assert/strict';
import test from 'node:test';
import { validate } from 'class-validator';
import { SyncFeedRequestDto } from './sync-feed.dto';

test('accepts dry-run and priority synchronization options', async () => {
  const dto = new SyncFeedRequestDto();
  dto.options = {
    dryRun: true,
    force: true,
    priority: 7,
    reason: 'Manual refresh requested',
    correlationId: 'corr-123',
  };

  const errors = await validate(dto, { whitelist: true });
  assert.equal(errors.length, 0);
});

test('rejects invalid priority values', async () => {
  const dto = new SyncFeedRequestDto();
  dto.options = {
    priority: 101,
  };

  const errors = await validate(dto, { whitelist: true });
  assert.ok(errors.some((error) => error.property === 'options'));
});
