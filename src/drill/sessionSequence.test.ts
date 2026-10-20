import { describe, expect, it, vi } from 'vitest';
import { questions } from '../data/questions';
import type { Category } from '../data/types';
import { buildQuestionSequence } from './sessionSequence';

const material = (['C', 'B', 'C', 'A', 'B', 'D', 'A'] as const).map((category, index) => ({
  ...questions[0]!, id: `q${index + 1}`, category,
}));

describe('buildQuestionSequence', () => {
  it.each(['sequential', 'random'] as const)('includes every material question exactly once in %s drills and category courses', (order) => {
    for (const course of ['mixed', 'A', 'B', 'C', 'D'] as const) {
      const sequence = buildQuestionSequence(questions, { course, order }, () => 0.5);
      const expected = questions
        .filter((question) => course === 'mixed' || question.category === course)
        .map(({ id }) => id);
      if (order === 'sequential') expect(sequence).toEqual(expected);
      expect([...sequence].sort()).toEqual([...expected].sort());
      expect(new Set(sequence).size).toBe(sequence.length);
    }
  });

  it('keeps every ID in material order for Mixed + Sequential', () => {
    expect(buildQuestionSequence(material, { course: 'mixed', order: 'sequential' }))
      .toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  });

  it.each([
    ['A', ['q4', 'q7']],
    ['B', ['q2', 'q5']],
    ['C', ['q1', 'q3']],
    ['D', ['q6']],
  ] satisfies [Category, string[]][])('filters Course %s and retains material order', (course, expected) => {
    expect(buildQuestionSequence(material, { course, order: 'sequential' })).toEqual(expected);
  });

  it('returns an empty sequence for a course with no matching questions', () => {
    expect(buildQuestionSequence(material.filter((question) => question.category !== 'D'), { course: 'D', order: 'sequential' })).toEqual([]);
  });

  it('does not use the random source for Sequential', () => {
    const random = vi.fn(() => 0);
    buildQuestionSequence(material, { course: 'mixed', order: 'sequential' }, random);
    expect(random).not.toHaveBeenCalled();
  });

  it('reproduces the expected Fisher–Yates result with an injected random stream', () => {
    for (let run = 0; run < 2; run++) {
      const values = [0, 0.5, 0.25, 0.75];
      const random = vi.fn(() => values.shift()!);
      expect(buildQuestionSequence(material.slice(0, 5), { course: 'mixed', order: 'random' }, random))
        .toEqual(['q4', 'q2', 'q5', 'q3', 'q1']);
      expect(random).toHaveBeenCalledTimes(4);
    }
  });

  it('shuffles only the filtered IDs', () => {
    const random = vi.fn(() => 0);
    expect(buildQuestionSequence(material, { course: 'C', order: 'random' }, random)).toEqual(['q3', 'q1']);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('does not mutate questions or a previously returned ID array and loses or duplicates no IDs', () => {
    const original = structuredClone(material);
    const frozen = Object.freeze(material.map((question) => Object.freeze({ ...question })));
    const ids = Object.freeze(buildQuestionSequence(frozen, { course: 'mixed', order: 'sequential' }));
    const shuffled = buildQuestionSequence(frozen, { course: 'mixed', order: 'random' }, () => 0);
    expect(frozen).toEqual(original);
    expect(ids).toEqual(original.map((question) => question.id));
    expect(shuffled).not.toBe(ids);
    expect([...shuffled].sort()).toEqual([...ids].sort());
    expect(new Set(shuffled).size).toBe(ids.length);
  });

  it.each(['sequential', 'random'] as const)('handles empty and one-question sequences with %s', (order) => {
    const random = vi.fn(() => 0);
    expect(buildQuestionSequence([], { course: 'mixed', order }, random)).toEqual([]);
    expect(buildQuestionSequence([material[0]!], { course: 'mixed', order }, random)).toEqual(['q1']);
    expect(buildQuestionSequence([material[0]!], { course: 'A', order }, random)).toEqual([]);
    expect(random).not.toHaveBeenCalled();
  });
});
