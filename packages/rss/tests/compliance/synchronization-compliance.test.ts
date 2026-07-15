import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    return stats.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

test('compliance: framework files are organized into the expected layered structure', () => {
  const root = join(__dirname, '..');
  const files = walk(root);
  const hasUnit = files.some((file) => file.includes('/unit/'));
  const hasIntegration = files.some((file) => file.includes('/integration/'));
  const hasResilience = files.some((file) => file.includes('/resilience/'));
  const hasCompliance = files.some((file) => file.includes('/compliance/'));
  const hasPerformance = files.some((file) => file.includes('/performance/'));
  const hasFixtures = files.some((file) => file.includes('/fixtures/'));
  const hasMocks = files.some((file) => file.includes('/mocks/'));
  const hasHelpers = files.some((file) => file.includes('/helpers/'));

  assert.equal(hasUnit, true);
  assert.equal(hasIntegration, true);
  assert.equal(hasResilience, true);
  assert.equal(hasCompliance, true);
  assert.equal(hasPerformance, true);
  assert.equal(hasFixtures, true);
  assert.equal(hasMocks, true);
  assert.equal(hasHelpers, true);
});
