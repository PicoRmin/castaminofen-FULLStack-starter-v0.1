import test from 'node:test';
import assert from 'node:assert/strict';

import { ImportService } from '../service';
import type { ProviderContract } from '../../providers/types';
import type { ImportRequest } from '../types';

class FakeProvider implements ProviderContract {
  public readonly metadata = {
    id: 'fake-provider',
    name: 'Fake Provider',
    version: '1.0.0',
    description: 'Test provider',
    priority: 100,
    formats: ['rss'],
    domains: ['example.com'],
    capabilities: [],
    author: 'Test',
  };

  public supports(url: string): boolean {
    return url.includes('example.com');
  }

  public priority(): number {
    return 100;
  }

  public capabilities(): readonly { name: string; enabled: boolean; description?: string }[] {
    return [];
  }

  public async download(url: string): Promise<string> {
    return `<rss version="2.0"><channel><title>Demo Feed</title><link>${url}</link><description>Test feed</description><item><title>Episode 1</title><guid>ep-1</guid><link>https://example.com/ep1</link><enclosure url="https://example.com/audio.mp3" type="audio/mpeg" length="123" /></item></channel></rss>`;
  }

  public async parse(input: string): Promise<unknown> {
    return {
      feed: {
        title: 'Demo Feed',
        feedId: 'feed-1',
        url: 'https://example.com/feed.xml',
        language: 'en',
        categories: ['Technology'],
        metadata: { source: 'fake' },
      },
      episodes: [
        {
          title: 'Episode 1',
          guid: 'ep-1',
          url: 'https://example.com/ep1',
          audioUrl: 'https://example.com/audio.mp3',
          publishedAt: '2026-01-01T00:00:00.000Z',
          metadata: { provider: 'fake' },
        },
      ],
      warnings: [],
      errors: [],
      metadata: { provider: 'fake', statistics: { invocationCount: 1 } },
    };
  }
}

test('imports a feed into repositories and returns a structured result', async () => {
  const provider = new FakeProvider();

  const createdPodcasts: unknown[] = [];
  const createdEpisodes: unknown[] = [];

  const repository = {
    async findPodcastByFeedUrl(url: string): Promise<unknown | null> {
      return null;
    },
    async createPodcast(input: unknown): Promise<unknown> {
      createdPodcasts.push(input);
      return { id: 'podcast-2', ...(input as Record<string, unknown>) };
    },
    async updatePodcast(id: string, input: unknown): Promise<unknown> {
      return { id, ...(input as Record<string, unknown>) };
    },
    async findEpisodeByGuid(podcastId: string, guid: string): Promise<unknown | null> {
      return null;
    },
    async createEpisode(input: unknown): Promise<unknown> {
      createdEpisodes.push(input);
      return { id: 'episode-2', ...(input as Record<string, unknown>) };
    },
    async updateEpisode(id: string, input: unknown): Promise<unknown> {
      return { id, ...(input as Record<string, unknown>) };
    },
  };

  const resolver = {
    async resolve(request: { url: string }) {
      return { provider, score: 100, strategyNames: ['default'], reasons: ['test'] };
    },
  };

  const service = new ImportService({
    resolver,
    feedRepository: repository as never,
    episodeRepository: repository as never,
  });

  const request: ImportRequest = {
    feedUrl: 'https://example.com/feed.xml',
    mode: 'initial',
    metadata: { requestId: 'req-1' },
  };

  const result = await service.import(request);

  assert.equal(result.success, true);
  assert.equal(result.statistics.createdPodcasts, 1);
  assert.equal(result.statistics.createdEpisodes, 1);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.conflicts.length, 0);
  assert.equal(createdPodcasts.length, 1);
  assert.equal(createdEpisodes.length, 1);
});
