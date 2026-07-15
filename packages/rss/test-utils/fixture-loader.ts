import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { providerFixtures } from '../test-data/fixtures';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');

export interface FixtureLoaderOptions {
  readonly fixtureId?: string;
}

export function loadFixture(id: string): string {
  const fixture = providerFixtures.find((candidate) => candidate.id === id);
  if (!fixture) {
    throw new Error(`Unknown fixture: ${id}`);
  }

  return fixture.xml;
}

export function loadFixtureFile(relativePath: string): string {
  return readFileSync(join(packageRoot, relativePath), 'utf8');
}

export function getFixtureMetadata(id: string) {
  const fixture = providerFixtures.find((candidate) => candidate.id === id);
  if (!fixture) {
    throw new Error(`Unknown fixture: ${id}`);
  }

  return fixture;
}
