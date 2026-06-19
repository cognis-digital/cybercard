/**
 * Starter-card scaffold used by the `new` command.
 */

import type { Card } from './types.js';

/** Build a minimal, valid starter card for users to edit. */
export function starterCard(): Card {
  return {
    title: 'My Quick-Reference Card',
    subtitle: 'A short description of what this card covers',
    footer: 'Maintainer: Your Name — Revised YYYY-MM-DD',
    sections: [
      {
        heading: 'First Section',
        rows: [
          { term: 'Key A', value: 'Description for key A' },
          { term: 'Key B', value: 'Description for key B', note: 'Optional extra note' },
        ],
      },
      {
        heading: 'Second Section',
        rows: [{ term: 'Key C', value: 'Description for key C' }],
      },
    ],
  };
}
