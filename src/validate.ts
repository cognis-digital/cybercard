/**
 * Card definition validation.
 *
 * Pure, dependency-free structural validation of an unknown value against the
 * {@link Card} schema. Collects every problem (rather than failing on the
 * first) so callers can report all issues at once — useful as a CI gate.
 */

import type { Card, ValidationIssue, ValidationResult } from './types.js';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Validate an arbitrary value against the Card schema.
 *
 * @returns A result with `valid` and a list of every issue found.
 */
export function validateCard(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });

  if (!isPlainObject(input)) {
    add('$', 'card must be a JSON object');
    return { valid: false, issues };
  }

  if (!isNonEmptyString(input.title)) {
    add('title', 'is required and must be a non-empty string');
  }

  if ('subtitle' in input && input.subtitle !== undefined && typeof input.subtitle !== 'string') {
    add('subtitle', 'must be a string when present');
  }

  if ('footer' in input && input.footer !== undefined && typeof input.footer !== 'string') {
    add('footer', 'must be a string when present');
  }

  const sections = input.sections;
  if (!Array.isArray(sections)) {
    add('sections', 'is required and must be an array');
  } else if (sections.length === 0) {
    add('sections', 'must contain at least one section');
  } else {
    sections.forEach((section, si) => {
      const sPath = `sections[${si}]`;
      if (!isPlainObject(section)) {
        add(sPath, 'must be an object');
        return;
      }
      if (!isNonEmptyString(section.heading)) {
        add(`${sPath}.heading`, 'is required and must be a non-empty string');
      }
      const rows = section.rows;
      if (!Array.isArray(rows)) {
        add(`${sPath}.rows`, 'is required and must be an array');
      } else if (rows.length === 0) {
        add(`${sPath}.rows`, 'must contain at least one row');
      } else {
        rows.forEach((row, ri) => {
          const rPath = `${sPath}.rows[${ri}]`;
          if (!isPlainObject(row)) {
            add(rPath, 'must be an object');
            return;
          }
          if (!isNonEmptyString(row.term)) {
            add(`${rPath}.term`, 'is required and must be a non-empty string');
          }
          if (typeof row.value !== 'string') {
            add(`${rPath}.value`, 'is required and must be a string');
          }
          if ('note' in row && row.note !== undefined && typeof row.note !== 'string') {
            add(`${rPath}.note`, 'must be a string when present');
          }
        });
      }
    });
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate and narrow an unknown value to a {@link Card}.
 *
 * @throws Error with a formatted, multi-issue message if validation fails.
 */
export function assertCard(input: unknown): Card {
  const result = validateCard(input);
  if (!result.valid) {
    const lines = result.issues.map((i) => `  - ${i.path}: ${i.message}`);
    throw new Error(`Invalid card definition:\n${lines.join('\n')}`);
  }
  return input as Card;
}
