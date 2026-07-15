import test from 'node:test';
import assert from 'node:assert/strict';

import { providerFixtures, getFixtureById } from '../../test-data/fixtures';
import { loadFixture, getFixtureMetadata } from '../../test-utils/fixture-loader';

test('fixture library exposes reusable provider fixtures', () => {
  assert.ok(providerFixtures.length >= 5);
  const fixture = getFixtureById('minimal-rss');
  assert.ok(fixture);
  assert.equal(fixture?.format, 'rss');
});

test('fixture loader returns deterministic fixture content', () => {
  const raw = loadFixture('minimal-rss');
  const metadata = getFixtureMetadata('minimal-rss');

  assert.ok(raw.includes('<rss'));
  assert.equal(metadata.expectedEpisodes, 1);
});
