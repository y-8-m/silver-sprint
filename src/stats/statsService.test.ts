import { describe, expect, it } from 'vitest';
import { recordRating } from './statsService';
import { createEmptyStats } from './statsTypes';
import type { Rating } from './statsTypes';

const firstDate = '2026-10-15T00:00:00.000Z';
const secondDate = '2026-10-15T01:00:00.000Z';

describe('recordRating', () => {
  it.each(['known', 'unsure', 'unknown'] as const)('records a first %s rating', (rating) => {
    expect(recordRating(createEmptyStats(), 'q1', rating, firstDate)).toEqual({ questions: { q1: {
      knownCount: rating === 'known' ? 1 : 0,
      unsureCount: rating === 'unsure' ? 1 : 0,
      unknownCount: rating === 'unknown' ? 1 : 0,
      lastRating: rating,
      lastAnsweredAt: firstDate,
    } } });
  });

  it('accumulates counts and updates the last rating and timestamp', () => {
    const first = recordRating(createEmptyStats(), 'q1', 'known', firstDate);
    const next = recordRating(first, 'q1', 'unsure', secondDate);
    expect(next.questions.q1).toEqual({
      knownCount: 1, unsureCount: 1, unknownCount: 0, lastRating: 'unsure', lastAnsweredAt: secondDate,
    });
  });

  it.each(['known', 'unsure', 'unknown'] as Rating[])('increments repeated %s ratings', (rating) => {
    const first = recordRating(createEmptyStats(), 'q1', rating, firstDate);
    const next = recordRating(first, 'q1', rating, secondDate);
    expect(next.questions.q1?.[`${rating}Count`]).toBe(2);
  });

  it('keeps other questions independent without mutating the original stats', () => {
    const original = recordRating(createEmptyStats(), 'q1', 'known', firstDate);
    Object.freeze(original.questions.q1);
    Object.freeze(original.questions);
    Object.freeze(original);
    const next = recordRating(original, 'q2', 'unknown', secondDate);
    expect(next).not.toBe(original);
    expect(next.questions).not.toBe(original.questions);
    expect(next.questions.q1).toBe(original.questions.q1);
    expect(Object.keys(original.questions)).toEqual(['q1']);
    expect(next.questions.q2?.unknownCount).toBe(1);
    const updated = recordRating(original, 'q1', 'unsure', secondDate);
    expect(updated.questions.q1).not.toBe(original.questions.q1);
    expect(original.questions.q1?.unsureCount).toBe(0);
    expect(updated.questions.q1?.unsureCount).toBe(1);
  });

  it.each(['constructor', 'toString', '__proto__'])('handles %s as an own question ID', (id) => {
    const stats = recordRating(createEmptyStats(), id, 'known', firstDate);
    expect(Object.hasOwn(stats.questions, id)).toBe(true);
    expect(stats.questions[id]?.knownCount).toBe(1);
    expect(recordRating(stats, id, 'unsure', secondDate).questions[id]?.unsureCount).toBe(1);
    expect(Object.getPrototypeOf(stats.questions)).toBe(Object.prototype);
  });

  it('creates independent empty objects', () => {
    const first = createEmptyStats();
    const second = createEmptyStats();
    expect(first).not.toBe(second);
    expect(first.questions).not.toBe(second.questions);
  });
});
