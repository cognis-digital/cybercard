import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCard, assertCard } from '../validate.js';
import { renderHtml } from '../render-html.js';
import { renderMarkdown } from '../render-md.js';

// dist/test -> repo root is two levels up.
const examplesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'examples');

test('examples directory contains shipped cards', () => {
  const files = readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 3, `expected >=3 example cards, found ${files.length}`);
});

test('every shipped example is a valid card and renders', () => {
  const files = readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(examplesDir, f), 'utf8'));
    const result = validateCard(data);
    assert.equal(result.valid, true, `${f} should be valid: ${JSON.stringify(result.issues)}`);
    const card = assertCard(data);
    const html = renderHtml(card);
    const md = renderMarkdown(card);
    assert.ok(html.includes('<!doctype html>'));
    assert.ok(md.startsWith('# '));
  }
});
