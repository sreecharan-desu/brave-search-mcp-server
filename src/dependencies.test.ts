import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Manifest {
  dependencies?: Record<string, string>;
}

interface Lockfile {
  packages?: Record<string, { version?: string }>;
}

const manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as Manifest;
const lockfile = JSON.parse(readFileSync(join(repoRoot, 'package-lock.json'), 'utf8')) as Lockfile;

// Compare two dotted numeric versions (e.g. "1.30.1" vs "1.30.0") without
// pulling in a semver implementation.
function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function lockedVersion(name: string): string {
  const entry = lockfile.packages?.[`node_modules/${name}`];
  assert.ok(entry?.version, `expected a lockfile entry for ${name}`);
  return entry.version;
}

describe('dependency security pins', () => {
  it('keeps proxy-addr at or above the fixed release', () => {
    assert.ok(compareVersions(lockedVersion('proxy-addr'), '2.0.8') >= 0);
  });

  it('keeps @modelcontextprotocol/sdk at or above the fixed release', () => {
    const pinned = manifest.dependencies?.['@modelcontextprotocol/sdk'] ?? '0';
    assert.ok(compareVersions(pinned, '1.30.1') >= 0);
    assert.ok(compareVersions(lockedVersion('@modelcontextprotocol/sdk'), '1.30.1') >= 0);
  });

  it('keeps body-parser at or above the fixed release', () => {
    assert.ok(compareVersions(lockedVersion('body-parser'), '2.4.0') >= 0);
  });

  it('keeps fast-uri at or above the fixed release', () => {
    assert.ok(compareVersions(lockedVersion('fast-uri'), '3.1.6') >= 0);
  });

  it('keeps zod at or above the fixed release', () => {
    assert.ok(compareVersions(manifest.dependencies?.zod ?? '0', '4.6.6') >= 0);
    assert.ok(compareVersions(lockedVersion('zod'), '4.6.6') >= 0);
  });
});
