/**
 * @cognis-digital/cybercard
 *
 * Public programmatic API. The CLI in cli.ts is a thin wrapper over these
 * exports.
 */

export type {
  Card,
  CardSection,
  CardRow,
  ValidationIssue,
  ValidationResult,
} from './types.js';

export { validateCard, assertCard } from './validate.js';
export { renderHtml, escapeHtml } from './render-html.js';
export { renderMarkdown, escapeMd } from './render-md.js';
export { starterCard } from './scaffold.js';
