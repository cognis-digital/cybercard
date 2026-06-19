import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCard, assertCard } from '../validate.js';
import { starterCard } from '../scaffold.js';

test('starter card is valid', () => {
  const result = validateCard(starterCard());
  assert.equal(result.valid, true);
  assert.equal(result.issues.length, 0);
});

test('non-object input is rejected', () => {
  for (const bad of [null, 42, 'x', [], true]) {
    const r = validateCard(bad);
    assert.equal(r.valid, false);
    assert.ok(r.issues.length >= 1);
  }
});

test('missing title is reported', () => {
  const r = validateCard({ sections: [{ heading: 'h', rows: [{ term: 't', value: 'v' }] }] });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.path === 'title'));
});

test('empty/whitespace title is rejected', () => {
  const r = validateCard({ title: '   ', sections: [{ heading: 'h', rows: [{ term: 't', value: 'v' }] }] });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.path === 'title'));
});

test('sections must be a non-empty array', () => {
  assert.equal(validateCard({ title: 't' }).valid, false);
  assert.equal(validateCard({ title: 't', sections: [] }).valid, false);
  assert.equal(validateCard({ title: 't', sections: 'nope' }).valid, false);
});

test('section requires heading and non-empty rows', () => {
  const r = validateCard({ title: 't', sections: [{ rows: [] }] });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.path === 'sections[0].heading'));
  assert.ok(r.issues.some((i) => i.path === 'sections[0].rows'));
});

test('row requires term and value', () => {
  const r = validateCard({
    title: 't',
    sections: [{ heading: 'h', rows: [{ term: '', value: 5 }] }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.path === 'sections[0].rows[0].term'));
  assert.ok(r.issues.some((i) => i.path === 'sections[0].rows[0].value'));
});

test('value may be an empty string (e.g. spacer), term may not', () => {
  const r = validateCard({
    title: 't',
    sections: [{ heading: 'h', rows: [{ term: 'x', value: '' }] }],
  });
  assert.equal(r.valid, true);
});

test('optional fields are type-checked when present', () => {
  const r = validateCard({
    title: 't',
    subtitle: 9,
    footer: {},
    sections: [{ heading: 'h', rows: [{ term: 'x', value: 'y', note: 1 }] }],
  });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.path === 'subtitle'));
  assert.ok(r.issues.some((i) => i.path === 'footer'));
  assert.ok(r.issues.some((i) => i.path === 'sections[0].rows[0].note'));
});

test('validation collects all issues, not just the first', () => {
  const r = validateCard({ sections: 'bad' });
  assert.ok(r.issues.length >= 2);
});

test('assertCard throws on invalid and returns card on valid', () => {
  assert.throws(() => assertCard({}), /Invalid card definition/);
  const card = starterCard();
  assert.equal(assertCard(card), card);
});
