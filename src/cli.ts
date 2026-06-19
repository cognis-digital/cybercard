#!/usr/bin/env node
/**
 * cybercard CLI.
 *
 * Commands:
 *   render <card.json> --format html|md -o <out>   Render a card.
 *   validate <card.json>                           Validate; exit !=0 on error.
 *   new [-o <file>]                                Scaffold a starter card.
 *   list <cards-dir>                               List cards in a directory.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCard, assertCard } from './validate.js';
import { renderHtml } from './render-html.js';
import { renderMarkdown } from './render-md.js';
import { starterCard } from './scaffold.js';
import type { Card } from './types.js';

const USAGE = `cybercard — printable security quick-reference card generator

Usage:
  cybercard render <card.json> [--format html|md] [-o <output>]
  cybercard validate <card.json>
  cybercard new [-o <output.json>]
  cybercard list <cards-dir>
  cybercard --help | --version

Options:
  --format, -f   Output format for render: "html" (default) or "md".
  -o, --out      Output file path. Defaults to stdout (render) or
                 cybercard-starter.json (new).
  --help, -h     Show this help.
  --version, -v  Show version.

Examples:
  cybercard validate examples/common-ports.json
  cybercard render examples/common-ports.json -f html -o ports.html
  cybercard new -o my-card.json
  cybercard list examples`;

const VERSION = '1.0.0';

/** Minimal flag parser: separates positionals from --flag/value options. */
function parseArgs(argv: string[]): {
  positionals: string[];
  options: Record<string, string | boolean>;
} {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};
  const aliases: Record<string, string> = {
    '-o': 'out',
    '--out': 'out',
    '-f': 'format',
    '--format': 'format',
    '-h': 'help',
    '--help': 'help',
    '-v': 'version',
    '--version': 'version',
  };
  const valued = new Set(['out', 'format']);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('-')) {
      const key = aliases[arg] ?? arg.replace(/^--?/, '');
      if (valued.has(key)) {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`option ${arg} requires a value`);
        }
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, options };
}

function readCardFile(path: string): unknown {
  const abs = resolve(path);
  let raw: string;
  try {
    raw = readFileSync(abs, 'utf8');
  } catch {
    throw new Error(`cannot read file: ${path}`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`invalid JSON in ${path}: ${(e as Error).message}`);
  }
}

function cmdValidate(positionals: string[]): number {
  const file = positionals[0];
  if (!file) {
    process.stderr.write('error: validate requires a <card.json> path\n');
    return 2;
  }
  const data = readCardFile(file);
  const result = validateCard(data);
  if (result.valid) {
    process.stdout.write(`OK: ${file} is a valid card definition\n`);
    return 0;
  }
  process.stderr.write(`INVALID: ${file}\n`);
  for (const issue of result.issues) {
    process.stderr.write(`  - ${issue.path}: ${issue.message}\n`);
  }
  return 1;
}

function cmdRender(positionals: string[], options: Record<string, string | boolean>): number {
  const file = positionals[0];
  if (!file) {
    process.stderr.write('error: render requires a <card.json> path\n');
    return 2;
  }
  const format = (options.format as string) ?? 'html';
  if (format !== 'html' && format !== 'md') {
    process.stderr.write(`error: unknown format "${format}" (use html or md)\n`);
    return 2;
  }
  const data = readCardFile(file);
  let card: Card;
  try {
    card = assertCard(data);
  } catch (e) {
    process.stderr.write(`error: ${(e as Error).message}\n`);
    return 1;
  }
  const output = format === 'html' ? renderHtml(card) : renderMarkdown(card);
  const out = options.out as string | undefined;
  if (out) {
    writeFileSync(resolve(out), output, 'utf8');
    process.stderr.write(`wrote ${format} card to ${out}\n`);
  } else {
    process.stdout.write(output);
  }
  return 0;
}

function cmdNew(options: Record<string, string | boolean>): number {
  const out = (options.out as string) ?? 'cybercard-starter.json';
  const json = JSON.stringify(starterCard(), null, 2) + '\n';
  writeFileSync(resolve(out), json, 'utf8');
  process.stderr.write(`wrote starter card to ${out}\n`);
  return 0;
}

function cmdList(positionals: string[]): number {
  const dir = positionals[0];
  if (!dir) {
    process.stderr.write('error: list requires a <cards-dir> path\n');
    return 2;
  }
  const abs = resolve(dir);
  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    process.stderr.write(`error: cannot read directory: ${dir}\n`);
    return 1;
  }
  const jsonFiles = entries.filter((e) => extname(e).toLowerCase() === '.json').sort();
  if (jsonFiles.length === 0) {
    process.stdout.write(`No card definitions (*.json) found in ${dir}\n`);
    return 0;
  }
  let invalidCount = 0;
  for (const f of jsonFiles) {
    const full = join(abs, f);
    if (!statSync(full).isFile()) continue;
    let status: string;
    let title = '';
    try {
      const data = readCardFile(full);
      const result = validateCard(data);
      if (result.valid) {
        status = 'valid  ';
        title = (data as Card).title;
      } else {
        status = 'INVALID';
        invalidCount++;
      }
    } catch (e) {
      status = 'ERROR  ';
      title = (e as Error).message;
      invalidCount++;
    }
    process.stdout.write(`  [${status}] ${basename(f)}${title ? `  —  ${title}` : ''}\n`);
  }
  return invalidCount > 0 ? 1 : 0;
}

export function main(argv: string[]): number {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`error: ${(e as Error).message}\n`);
    return 2;
  }
  const { positionals, options } = parsed;

  if (options.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  const command = positionals.shift();
  if (!command || options.help) {
    process.stdout.write(USAGE + '\n');
    return command ? 0 : options.help ? 0 : 1;
  }

  switch (command) {
    case 'validate':
      return cmdValidate(positionals);
    case 'render':
      return cmdRender(positionals, options);
    case 'new':
      return cmdNew(options);
    case 'list':
      return cmdList(positionals);
    default:
      process.stderr.write(`error: unknown command "${command}"\n\n${USAGE}\n`);
      return 2;
  }
}

const isMain =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  process.exit(main(process.argv.slice(2)));
}
