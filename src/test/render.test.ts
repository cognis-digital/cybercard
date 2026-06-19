import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHtml, escapeHtml } from '../render-html.js';
import { renderMarkdown, escapeMd } from '../render-md.js';
import type { Card } from '../types.js';

const sample: Card = {
  title: 'Sample <Card> & "Quotes"',
  subtitle: 'Sub & title',
  footer: 'Footer text',
  sections: [
    {
      heading: 'Section One',
      rows: [
        { term: '22', value: 'SSH', note: 'TCP' },
        { term: 'a|b', value: 'pipe & <tag>' },
      ],
    },
  ],
};

test('escapeHtml escapes all five entities', () => {
  assert.equal(escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
});

test('HTML output is a complete document', () => {
  const html = renderHtml(sample);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('</html>'));
  assert.ok(html.includes('<style>'));
});

test('HTML escapes user content (no raw injection)', () => {
  const html = renderHtml(sample);
  assert.ok(html.includes('Sample &lt;Card&gt; &amp; &quot;Quotes&quot;'));
  assert.ok(!html.includes('<Card>'));
});

test('HTML is fully self-contained: no external references', () => {
  const html = renderHtml(sample);
  // No remote protocols anywhere in the document.
  assert.ok(!/https?:\/\//i.test(html), 'should contain no http(s) URLs');
  assert.ok(!/src\s*=/i.test(html), 'should contain no src attributes');
  assert.ok(!/<link\b/i.test(html), 'should contain no <link> tags');
  assert.ok(!/<script\b/i.test(html), 'should contain no <script> tags');
  assert.ok(!/@import/i.test(html), 'should contain no CSS @import');
  assert.ok(!/url\s*\(/i.test(html), 'should contain no CSS url() references');
});

test('HTML includes section and row content', () => {
  const html = renderHtml(sample);
  assert.ok(html.includes('Section One'));
  assert.ok(html.includes('>22<'));
  assert.ok(html.includes('SSH'));
  assert.ok(html.includes('TCP'));
});

test('HTML omits optional blocks when absent', () => {
  const minimal: Card = { title: 'T', sections: [{ heading: 'H', rows: [{ term: 'a', value: 'b' }] }] };
  const html = renderHtml(minimal);
  // The class selectors always exist in the stylesheet; assert the actual
  // markup elements are not emitted.
  assert.ok(!html.includes('<p class="card-subtitle">'));
  assert.ok(!html.includes('<div class="card-footer">'));
});

test('escapeMd escapes pipes, backslashes, and newlines', () => {
  assert.equal(escapeMd('a|b\\c\nd'), 'a\\|b\\\\c d');
});

test('Markdown output has heading and table per section', () => {
  const md = renderMarkdown(sample);
  assert.ok(md.includes('# Sample'));
  assert.ok(md.includes('_Sub & title_'));
  assert.ok(md.includes('## Section One'));
  assert.ok(md.includes('| Term | Value |'));
  assert.ok(md.includes('| --- | --- |'));
});

test('Markdown escapes pipes in cells so table is intact', () => {
  const md = renderMarkdown(sample);
  assert.ok(md.includes('| a\\|b |'));
});

test('Markdown merges note into value with em dash', () => {
  const md = renderMarkdown(sample);
  assert.ok(md.includes('SSH — TCP'));
});

test('Markdown renders footer divider', () => {
  const md = renderMarkdown(sample);
  assert.ok(md.includes('---'));
  assert.ok(md.includes('Footer text'));
});
