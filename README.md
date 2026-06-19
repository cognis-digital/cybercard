# cybercard

**Printable security quick-reference card generator.**

`cybercard` turns a small JSON card definition into a self-contained,
print-ready **HTML** card (clean multi-column layout, all CSS inlined — no
external links, fonts, or scripts) and a **Markdown** version. It also
**validates** card definitions, so it can run as a CI gate that fails the
build when a card is malformed.

Use it to keep a team's cheat sheets — common ports, HTTP status codes, an
incident-response contact card — in version control as data, and regenerate
clean printable cards on every change.

- Zero runtime dependencies (Node standard library only).
- TypeScript, ESM, built with `tsc`.
- Self-contained HTML output — print it, archive it, hand it out offline.

## Install

```bash
npm install
npm run build
```

This produces the CLI at `dist/cli.js`. To use the `cybercard` command
globally from a clone:

```bash
npm link
cybercard --help
```

Or run it directly without linking:

```bash
node dist/cli.js --help
```

## Usage

```
cybercard render <card.json> [--format html|md] [-o <output>]
cybercard validate <card.json>
cybercard new [-o <output.json>]
cybercard list <cards-dir>
cybercard --help | --version
```

### Render a card

```bash
# HTML to a file
cybercard render examples/common-ports.json --format html -o common-ports.html

# Markdown to stdout
cybercard render examples/http-status-codes.json --format md
```

`--format` defaults to `html`. Without `-o`, output goes to stdout.

### Validate a card (CI gate)

```bash
cybercard validate examples/common-ports.json
```

Exits `0` when valid; exits non-zero and prints every problem otherwise —
ideal for a pre-commit hook or CI step.

### Scaffold a new card

```bash
cybercard new -o my-card.json
```

Writes a minimal, valid starter card you can edit.

### List cards in a directory

```bash
cybercard list examples
```

Prints each `*.json` card with its validation status and title. Exits
non-zero if any card in the directory is invalid.

## Card definition format

A card is a JSON object: a `title`, optional `subtitle`/`footer`, and one or
more `sections`. Each section has a `heading` and a list of reference `rows`;
each row is a `{ term, value }` pair with an optional `note`.

```json
{
  "title": "Common Network Ports",
  "subtitle": "Frequently encountered TCP/UDP service ports",
  "footer": "Maintainer: Cognis Digital",
  "sections": [
    {
      "heading": "Remote Access & Shell",
      "rows": [
        { "term": "22", "value": "SSH — secure shell / SFTP", "note": "TCP" },
        { "term": "3389", "value": "RDP — Windows remote desktop", "note": "TCP/UDP" }
      ]
    }
  ]
}
```

### Validation rules

| Field | Rule |
| --- | --- |
| `title` | required, non-empty string |
| `subtitle`, `footer` | optional strings |
| `sections` | required, non-empty array |
| `sections[].heading` | required, non-empty string |
| `sections[].rows` | required, non-empty array |
| `rows[].term` | required, non-empty string |
| `rows[].value` | required string (may be empty) |
| `rows[].note` | optional string |

Validation collects **all** issues at once and reports each with a dotted
path (e.g. `sections[0].rows[2].term`).

## Examples

Authored, factual reference cards ship in [`examples/`](examples/):

- `common-ports.json` — common TCP/UDP service ports for triage.
- `http-status-codes.json` — standard HTTP response codes by class.
- `incident-response-contacts-template.json` — a fill-in IR contact and
  first-actions template.

## Programmatic API

```ts
import { validateCard, renderHtml, renderMarkdown } from '@cognis-digital/cybercard';

const card = JSON.parse(fs.readFileSync('card.json', 'utf8'));
const result = validateCard(card);
if (result.valid) {
  const html = renderHtml(card);
  const md = renderMarkdown(card);
}
```

## Development

```bash
npm run build   # compile TypeScript to dist/
npm test        # build, then run node:test over dist/test/*.test.js
```

CI (`.github/workflows/ci.yml`) installs, builds, tests, and validates every
shipped example on Ubuntu with Node 20.

## License

License: COCL 1.0.

Maintainer: **Cognis Digital**.
