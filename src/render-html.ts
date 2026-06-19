/**
 * Self-contained HTML renderer.
 *
 * Produces a single HTML document with all styling inlined in a <style> block.
 * The output contains NO external references (no remote stylesheets, fonts,
 * scripts, or images) so it can be printed or archived offline. This property
 * is asserted by the test suite.
 */

import type { Card } from './types.js';

/** Escape a string for safe inclusion in HTML text/attribute context. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLE = `
:root {
  --ink: #14181f;
  --muted: #5b6675;
  --line: #d8dee8;
  --accent: #0d5c63;
  --term-bg: #eef3f5;
  --paper: #ffffff;
  --page-bg: #eceff3;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--ink);
  background: var(--page-bg);
  line-height: 1.4;
  padding: 24px;
}
.card {
  max-width: 1024px;
  margin: 0 auto;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(20, 24, 31, 0.08);
}
.card-header {
  border-bottom: 3px solid var(--accent);
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.card-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}
.card-subtitle {
  font-size: 14px;
  color: var(--muted);
  margin: 6px 0 0;
}
.sections {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px 28px;
}
.section { break-inside: avoid; }
.section-heading {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
}
.row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 3px 0;
  font-size: 13px;
}
.row + .row { border-top: 1px dotted var(--line); }
.term {
  flex: 0 0 auto;
  min-width: 84px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  background: var(--term-bg);
  border-radius: 4px;
  padding: 1px 6px;
}
.value { flex: 1 1 auto; }
.note { display: block; font-size: 11px; color: var(--muted); margin-top: 1px; }
.card-footer {
  margin-top: 24px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  color: var(--muted);
}
@media print {
  body { background: #fff; padding: 0; }
  .card { border: none; box-shadow: none; border-radius: 0; max-width: none; }
}
`.trim();

/** Render a validated card to a complete, self-contained HTML document. */
export function renderHtml(card: Card): string {
  const sectionsHtml = card.sections
    .map((section) => {
      const rowsHtml = section.rows
        .map((row) => {
          const note = row.note ? `<span class="note">${escapeHtml(row.note)}</span>` : '';
          return [
            '        <div class="row">',
            `          <span class="term">${escapeHtml(row.term)}</span>`,
            `          <span class="value">${escapeHtml(row.value)}${note}</span>`,
            '        </div>',
          ].join('\n');
        })
        .join('\n');
      return [
        '      <section class="section">',
        `        <h2 class="section-heading">${escapeHtml(section.heading)}</h2>`,
        rowsHtml,
        '      </section>',
      ].join('\n');
    })
    .join('\n');

  const subtitle = card.subtitle
    ? `\n      <p class="card-subtitle">${escapeHtml(card.subtitle)}</p>`
    : '';
  const footer = card.footer
    ? `\n    <div class="card-footer">${escapeHtml(card.footer)}</div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(card.title)}</title>
  <style>
${STYLE}
  </style>
</head>
<body>
  <main class="card">
    <header class="card-header">
      <h1 class="card-title">${escapeHtml(card.title)}</h1>${subtitle}
    </header>
    <div class="sections">
${sectionsHtml}
    </div>${footer}
  </main>
</body>
</html>
`;
}
