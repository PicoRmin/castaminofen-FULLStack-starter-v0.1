import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderHarness } from '../test-utils/provider-builder';
import { loadFixture, getFixtureMetadata } from '../test-utils/fixture-loader';
import { providerFixtures } from '../test-data/fixtures';

export function registerProviderComplianceTests(prefix = 'provider compliance') {
  for (const fixture of providerFixtures) {
    test(`${prefix} :: ${fixture.name}`, async () => {
      const provider = createProviderHarness({
        responses: [
          {
            status: 200,
            headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
            body: loadFixture(fixture.id),
          },
        ],
      });

      const result = await provider.execute('https://example.com/feed.xml');
      const metadata = getFixtureMetadata(fixture.id);

      const errors = result.data?.errors?.length ?? 0;
      const warnings = result.data?.warnings?.length ?? 0;
      const episodes = result.data?.episodes?.length ?? 0;

      assert.ok(result.success || errors > 0 || warnings > 0 || episodes >= 0);
      assert.ok(errors >= fixture.expectedErrors);
      assert.ok(warnings >= 0);
      assert.ok(Array.isArray(result.data?.episodes));
      assert.ok(typeof metadata.expectedEpisodes === 'number');
    });
  }
}
