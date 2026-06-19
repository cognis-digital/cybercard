/**
 * Markdown renderer.
 *
 * Produces a GitHub-flavored Markdown document: a heading per card, a table
 * per section. Pipe and backslash characters in cell content are escaped so
 * the table structure stays intact.
 */

import type { Card } from './types.js';

/** Escape characters that would break a Markdown table cell. */
export function escapeMd(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** Render a validated card to a Markdown document. */
export function renderMarkdown(card: Card): string {
  const parts: string[] = [];
  parts.push(`# ${escapeMd(card.title)}`);
  if (card.subtitle) {
    parts.push('');
    parts.push(`_${escapeMd(card.subtitle)}_`);
  }

  for (const section of card.sections) {
    parts.push('');
    parts.push(`## ${escapeMd(section.heading)}`);
    parts.push('');
    parts.push('| Term | Value |');
    parts.push('| --- | --- |');
    for (const row of section.rows) {
      const value = row.note
        ? `${escapeMd(row.value)} — ${escapeMd(row.note)}`
        : escapeMd(row.value);
      parts.push(`| ${escapeMd(row.term)} | ${value} |`);
    }
  }

  if (card.footer) {
    parts.push('');
    parts.push('---');
    parts.push('');
    parts.push(escapeMd(card.footer));
  }

  return parts.join('\n') + '\n';
}
