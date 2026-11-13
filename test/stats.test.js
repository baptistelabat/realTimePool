import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeStats, sanitizeVote } from '../src/stats.js';

test('sanitizeVote accepts numbers and numeric strings, clamped to [0, 100]', () => {
  assert.equal(sanitizeVote(42), 42);
  assert.equal(sanitizeVote('42.5'), 42.5);
  assert.equal(sanitizeVote(-5), 0);
  assert.equal(sanitizeVote(1e9), 100);
});

test('sanitizeVote rejects garbage', () => {
  for (const bad of [NaN, Infinity, 'abc', null, undefined, {}, [], true]) {
    assert.equal(sanitizeVote(bad), null, `expected ${String(bad)} to be rejected`);
  }
});

test('computeStats with no votes', () => {
  assert.deepEqual(computeStats([]), { count: 0, mean: null, buckets: [0, 0, 0, 0, 0, 0] });
});

test('computeStats computes the mean and fills buckets at their boundaries', () => {
  const stats = computeStats([0, 9.9, 10, 29, 30, 50, 70, 89.9, 90, 100]);
  assert.equal(stats.count, 10);
  assert.equal(stats.mean, 47.88);
  assert.deepEqual(stats.buckets, [2, 2, 1, 1, 2, 2]);
});
