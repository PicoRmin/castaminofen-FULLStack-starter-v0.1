import test from 'node:test';
import assert from 'node:assert/strict';

import { PodcastsService } from './podcasts.service';

test('PodcastsService lists podcasts', () => {
  const service = new PodcastsService({} as any);
  const podcasts = service.findAll();
  assert.ok(Array.isArray(podcasts));
  assert.ok(podcasts.length > 0);
});
