import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const PUBLIC_WRAPBOOK_INTEGRATION = 'https://takeagent.ai/integrations/wrapbook';
const PRIVATE_HOST_REPO = /github\.com\/jongos\/takeagent(?:\/|$)/;

test('integration manifest uses public integration link', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../integration-manifest.json', import.meta.url), 'utf8'),
  );
  assert.equal(manifest.sourceIssue, PUBLIC_WRAPBOOK_INTEGRATION);
  assert.doesNotMatch(manifest.sourceIssue, PRIVATE_HOST_REPO);
});

test('README avoids private host repository links', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.doesNotMatch(readme, PRIVATE_HOST_REPO);
  assert.match(readme, /takeagent\.ai\/integrations\/wrapbook/);
});

test('host release status avoids private host links and internal paths', async () => {
  const doc = await readFile(new URL('../docs/host-release-status.md', import.meta.url), 'utf8');
  assert.doesNotMatch(doc, PRIVATE_HOST_REPO);
  assert.doesNotMatch(doc, /src\/lib\//);
  assert.match(doc, /takeagent\.ai\/integrations/);
});