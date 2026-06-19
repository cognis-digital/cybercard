import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'cli.js');
const examplesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'examples');

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function run(args: string[]): RunResult {
  try {
    const stdout = execFileSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

test('validate exits 0 on a valid card', () => {
  const r = run(['validate', join(examplesDir, 'common-ports.json')]);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('OK'));
});

test('validate exits non-zero on an invalid card (CI gate)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cybercard-'));
  try {
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, JSON.stringify({ title: '', sections: [] }));
    const r = run(['validate', bad]);
    assert.equal(r.status, 1);
    assert.ok(r.stderr.includes('INVALID'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('render writes an HTML file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cybercard-'));
  try {
    const out = join(dir, 'card.html');
    const r = run(['render', join(examplesDir, 'http-status-codes.json'), '-f', 'html', '-o', out]);
    assert.equal(r.status, 0);
    assert.ok(existsSync(out));
    assert.ok(readFileSync(out, 'utf8').includes('<!doctype html>'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('render to stdout in markdown', () => {
  const r = run(['render', join(examplesDir, 'http-status-codes.json'), '--format', 'md']);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.startsWith('# HTTP Status Codes'));
});

test('render rejects unknown format', () => {
  const r = run(['render', join(examplesDir, 'common-ports.json'), '-f', 'pdf']);
  assert.equal(r.status, 2);
});

test('new scaffolds a valid starter card', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cybercard-'));
  try {
    const out = join(dir, 'starter.json');
    const r = run(['new', '-o', out]);
    assert.equal(r.status, 0);
    assert.ok(existsSync(out));
    const v = run(['validate', out]);
    assert.equal(v.status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('list reports shipped examples', () => {
  const r = run(['list', examplesDir]);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('common-ports.json'));
  assert.ok(r.stdout.includes('valid'));
});

test('--version prints version', () => {
  const r = run(['--version']);
  assert.equal(r.status, 0);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test('unknown command exits 2', () => {
  const r = run(['frobnicate']);
  assert.equal(r.status, 2);
});
