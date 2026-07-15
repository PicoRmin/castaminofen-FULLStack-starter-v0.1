import test from 'node:test';
import assert from 'node:assert/strict';
import { PodcastsService } from './podcasts.service';

test('podcasts service exposes featured content and search results', () => {
  const service = new PodcastsService();
  const home = service.getHome();
  const searchResults = service.searchFallback('design');

  assert.equal(home.featuredPodcasts.length > 0, true);
  assert.equal(home.latestEpisodes.length > 0, true);
  assert.equal(searchResults.podcasts.length > 0, true);
  assert.equal(searchResults.episodes.length > 0, true);
});
