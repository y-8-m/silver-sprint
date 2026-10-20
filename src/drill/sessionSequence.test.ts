import { describe, expect, it, vi } from 'vitest';
import { questions } from '../data/questions';
import type { Category } from '../data/types';
import { buildQuestionSequence } from './sessionSequence';

const material = (['C', 'B', 'C', 'A', 'B', 'D', 'A'] as const).map((category, index) => ({
  ...questions[0]!, id: `q${index + 1}`, category,
}));

describe('buildQuestionSequence', () => {
  it.each([5, 10, 15] as const)('samples at most %i questions from every course without duplicates or mutation', (questionCount) => {
    const original = structuredClone(questions);
    const frozen = Object.freeze(questions.map((question) => Object.freeze({ ...question })));
    for (const course of ['mixed', 'A', 'B', 'C', 'D'] as const) {
      const candidates = frozen.filter((question) => course === 'mixed' || question.category === course).map(({ id }) => id);
      for (const order of ['sequential', 'random'] as const) {
        const sequence = buildQuestionSequence(frozen, { course, order, questionCount }, () => 0.5);
        expect(sequence).toHaveLength(Math.min(questionCount, candidates.length));
        expect(new Set(sequence).size).toBe(sequence.length);
        expect(sequence.every((id) => candidates.includes(id))).toBe(true);
        if (order === 'sequential') {
          expect(sequence).toEqual(candidates.filter((id) => sequence.includes(id)));
        }
      }
    }
    expect(frozen).toEqual(original);
  });

  it('chooses a reproducible random subset before applying the presentation order', () => {
    for (let run = 0; run < 2; run++) {
      const random = vi.fn(() => 0.5);
      expect(buildQuestionSequence(material, { course: 'mixed', order: 'random', questionCount: 5 }, random))
        .toEqual(['q1', 'q6', 'q2', 'q5', 'q3']);
      expect(random).toHaveBeenCalledTimes(6);
      expect(buildQuestionSequence(material, { course: 'mixed', order: 'sequential', questionCount: 5 }, () => 0.5))
        .toEqual(['q1', 'q2', 'q3', 'q5', 'q6']);
    }
  });

  it.each([5, 10, 15, 'all'] as const)('handles zero and one candidate with count %s in both orders', (questionCount) => {
    for (const order of ['sequential', 'random'] as const) {
      const random = vi.fn(() => 0);
      expect(buildQuestionSequence([], { course: 'mixed', order, questionCount }, random)).toEqual([]);
      expect(buildQuestionSequence([material[0]!], { course: 'mixed', order, questionCount }, random)).toEqual(['q1']);
      expect(random).not.toHaveBeenCalled();
    }
  });

  it.each(['sequential', 'random'] as const)('includes every material question exactly once in %s drills and category courses', (order) => {
    for (const course of ['mixed', 'A', 'B', 'C', 'D'] as const) {
      const sequence = buildQuestionSequence(questions, { course, order, questionCount: 'all' }, () => 0.5);
      const expected = questions
        .filter((question) => course === 'mixed' || question.category === course)
        .map(({ id }) => id);
      if (order === 'sequential') expect(sequence).toEqual(expected);
      expect([...sequence].sort()).toEqual([...expected].sort());
      expect(new Set(sequence).size).toBe(sequence.length);
    }
  });

  it('keeps every ID in material order for Mixed + Sequential', () => {
    expect(buildQuestionSequence(material, { course: 'mixed', order: 'sequential', questionCount: 'all' }))
      .toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  });

  it.each([
    ['A', ['q4', 'q7']],
    ['B', ['q2', 'q5']],
    ['C', ['q1', 'q3']],
    ['D', ['q6']],
  ] satisfies [Category, string[]][])('filters Course %s and retains material order', (course, expected) => {
    expect(buildQuestionSequence(material, { course, order: 'sequential', questionCount: 'all' })).toEqual(expected);
  });

  it('returns an empty sequence for a course with no matching questions', () => {
    expect(buildQuestionSequence(material.filter((question) => question.category !== 'D'), { course: 'D', order: 'sequential', questionCount: 'all' })).toEqual([]);
  });

  it('does not use the random source for Sequential', () => {
    const random = vi.fn(() => 0);
    buildQuestionSequence(material, { course: 'mixed', order: 'sequential', questionCount: 'all' }, random);
    expect(random).not.toHaveBeenCalled();
  });

  it('reproduces the expected Fisher–Yates result with an injected random stream', () => {
    for (let run = 0; run < 2; run++) {
      const values = [0, 0.5, 0.25, 0.75];
      const random = vi.fn(() => values.shift()!);
      expect(buildQuestionSequence(material.slice(0, 5), { course: 'mixed', order: 'random', questionCount: 'all' }, random))
        .toEqual(['q4', 'q2', 'q5', 'q3', 'q1']);
      expect(random).toHaveBeenCalledTimes(4);
    }
  });

  it('shuffles only the filtered IDs', () => {
    const random = vi.fn(() => 0);
    expect(buildQuestionSequence(material, { course: 'C', order: 'random', questionCount: 'all' }, random)).toEqual(['q3', 'q1']);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('does not mutate questions or a previously returned ID array and loses or duplicates no IDs', () => {
    const original = structuredClone(material);
    const frozen = Object.freeze(material.map((question) => Object.freeze({ ...question })));
    const ids = Object.freeze(buildQuestionSequence(frozen, { course: 'mixed', order: 'sequential', questionCount: 'all' }));
    const shuffled = buildQuestionSequence(frozen, { course: 'mixed', order: 'random', questionCount: 'all' }, () => 0);
    expect(frozen).toEqual(original);
    expect(ids).toEqual(original.map((question) => question.id));
    expect(shuffled).not.toBe(ids);
    expect([...shuffled].sort()).toEqual([...ids].sort());
    expect(new Set(shuffled).size).toBe(ids.length);
  });

  it.each(['sequential', 'random'] as const)('handles empty and one-question sequences with %s', (order) => {
    const random = vi.fn(() => 0);
    expect(buildQuestionSequence([], { course: 'mixed', order, questionCount: 'all' }, random)).toEqual([]);
    expect(buildQuestionSequence([material[0]!], { course: 'mixed', order, questionCount: 'all' }, random)).toEqual(['q1']);
    expect(buildQuestionSequence([material[0]!], { course: 'A', order, questionCount: 'all' }, random)).toEqual([]);
    expect(random).not.toHaveBeenCalled();
  });
});

describe('75-question material integration', () => {
  it.each(['mixed', 'B'] as const)('includes the complete %s pool in both orders', (course) => {
    const expected = questions.filter((q) => course === 'mixed' || q.category === course).map((q) => q.id);
    expect(expected).toHaveLength(course === 'mixed' ? 75 : 38);
    const sequential = buildQuestionSequence(questions, { course, order: 'sequential', questionCount: 'all' });
    const random = buildQuestionSequence(questions, { course, order: 'random', questionCount: 'all' }, () => 0.5);
    expect(sequential).toEqual(expected);
    expect([...random].sort()).toEqual([...expected].sort());
    expect(new Set(random).size).toBe(expected.length);
  });

  it.each([5, 10, 15, 'all'] as const)('can select every new question with count %s, preserving subset and ordering guarantees', (questionCount) => {
    for (const course of ['mixed', 'B'] as const) {
      const candidates = questions.filter((q) => course === 'mixed' || q.category === course).map((q) => q.id);
      for (const question of questions.slice(60)) {
        const targetIndex = candidates.indexOf(question.id);
        for (const order of ['sequential', 'random'] as const) {
          // A valid Fisher–Yates stream that moves this candidate to the first slot.
          let index = candidates.length - 1;
          const random = () => {
            const target = index === targetIndex ? 0 : index;
            return target / (index-- + 1);
          };
          const sequence = buildQuestionSequence(questions, { course, order, questionCount }, random);
          expect(sequence, question.id).toContain(question.id);
          expect(sequence).toHaveLength(questionCount === 'all' ? candidates.length : questionCount);
          expect(new Set(sequence).size).toBe(sequence.length);
          expect(sequence.every((id) => candidates.includes(id))).toBe(true);
          if (order === 'sequential') expect(sequence).toEqual(candidates.filter((id) => sequence.includes(id)));
        }
      }
    }
  });
});
