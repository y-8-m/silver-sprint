import { describe, expect, it } from 'vitest';
import { questions as material } from '../data/questions';
import { getQuestionStatsViews, getRecentQuestionStats, getStatsSummary, getWeakQuestionIds, getWeakQuestionStats } from './statsSelectors';
import { recordRating } from './statsService';
import { createEmptyStats } from './statsTypes';
import type { Stats } from './statsTypes';

const questions = material.slice(0, 4).map((question, index) => ({ ...question, id: `q${index + 1}` }));
// Deliberately different property order from the material.
const stats: Stats = { questions: {
  q3: { knownCount: 1, unsureCount: 0, unknownCount: 0, lastRating: 'known', lastAnsweredAt: '2026-10-15T03:00:00.000Z' },
  q2: { knownCount: 0, unsureCount: 0, unknownCount: 2, lastRating: 'unknown', lastAnsweredAt: '2026-10-15T02:00:00.000Z' },
  q1: { knownCount: 3, unsureCount: 1, unknownCount: 0, lastRating: 'unsure', lastAnsweredAt: '2026-10-15T01:00:00.000Z' },
  deleted: { knownCount: 100, unsureCount: 100, unknownCount: 100, lastRating: 'unknown', lastAnsweredAt: '2026-10-15T04:00:00.000Z' },
} };

describe('Stats selectors', () => {
  it('handles empty stats and counts all material as unrated', () => {
    expect(getStatsSummary(createEmptyStats(), questions)).toEqual({
      ratedQuestionCount: 0, unratedQuestionCount: 4, knownCount: 0, unsureCount: 0, unknownCount: 0, totalRatings: 0,
    });
    expect(getWeakQuestionIds(createEmptyStats(), questions)).toEqual([]);
    expect(getRecentQuestionStats(createEmptyStats(), questions)).toEqual([]);
    expect(getQuestionStatsViews(createEmptyStats(), questions).every((view) => view.stats === null)).toBe(true);
  });

  it('distinguishes rated question IDs from historical rating counts, excluding orphans', () => {
    expect(getStatsSummary(stats, questions)).toEqual({
      ratedQuestionCount: 3, unratedQuestionCount: 1, knownCount: 4, unsureCount: 1, unknownCount: 2, totalRatings: 7,
    });
  });

  it('joins all material in definition order, including unrated questions', () => {
    const views = getQuestionStatsViews(stats, questions);
    expect(views.map((view) => view.questionId)).toEqual(['q1', 'q2', 'q3', 'q4']);
    expect(views[0]).toEqual({ questionId: 'q1', category: questions[0]!.category, topic: questions[0]!.topic, stats: stats.questions.q1 });
    expect(views[3]?.stats).toBeNull();
  });

  it('selects unsure and unknown in material order, excluding known and orphan IDs', () => {
    expect(getWeakQuestionIds(stats, questions)).toEqual(['q1', 'q2']);
    expect(getWeakQuestionStats(stats, questions).map((view) => view.questionId)).toEqual(['q1', 'q2']);
  });

  it('removes a weak question when its last rating becomes known', () => {
    const updated = recordRating(stats, 'q1', 'known', '2026-10-15T05:00:00.000Z');
    expect(getWeakQuestionIds(updated, questions)).toEqual(['q2']);
  });

  it('sorts recent evaluations newest first, excluding orphans and applying limit', () => {
    expect(getRecentQuestionStats(stats, questions).map((view) => view.questionId)).toEqual(['q3', 'q2', 'q1']);
    expect(getRecentQuestionStats(stats, questions, 2).map((view) => view.questionId)).toEqual(['q3', 'q2']);
    expect(getRecentQuestionStats(stats, questions, 0)).toEqual([]);
    expect(getRecentQuestionStats(stats, questions, -1)).toEqual([]);
  });

  it('limits recent evaluations to five by default', () => {
    const sixQuestions = Array.from({ length: 6 }, (_, index) => ({ ...questions[0]!, id: `recent-${index}` }));
    let sixStats = createEmptyStats();
    for (let index = 0; index < sixQuestions.length; index++) {
      sixStats = recordRating(sixStats, sixQuestions[index]!.id, 'known', `2026-10-15T0${index}:00:00Z`);
    }
    expect(getRecentQuestionStats(sixStats, sixQuestions).map((view) => view.questionId)).toEqual([
      'recent-5', 'recent-4', 'recent-3', 'recent-2', 'recent-1',
    ]);
  });

  it('compares actual timestamps with offsets and keeps material order on ties', () => {
    let updated = recordRating(stats, 'q1', 'unsure', '2026-10-15T12:00:00+09:00');
    expect(getRecentQuestionStats(updated, questions).map((view) => view.questionId)).toEqual(['q1', 'q3', 'q2']);
    updated = recordRating(updated, 'q2', 'unknown', '2026-10-14T23:00:00-05:00');
    expect(getRecentQuestionStats(updated, questions)[0]?.questionId).toBe('q2');
  });

  it('returns zero counts and empty lists without current material', () => {
    expect(getStatsSummary(stats, [])).toEqual({ ratedQuestionCount: 0, unratedQuestionCount: 0, knownCount: 0, unsureCount: 0, unknownCount: 0, totalRatings: 0 });
    expect(getWeakQuestionIds(stats, [])).toEqual([]);
    expect(getRecentQuestionStats(stats, [])).toEqual([]);
  });

  it.each(['constructor', 'toString', '__proto__'])('ignores inherited properties but accepts own ID %s', (id) => {
    const specialMaterial = [{ ...questions[0]!, id }];
    expect(getStatsSummary(createEmptyStats(), specialMaterial).unratedQuestionCount).toBe(1);
    const specialStats = recordRating(createEmptyStats(), id, 'unsure', '2026-10-15T00:00:00Z');
    expect(getWeakQuestionIds(specialStats, specialMaterial)).toEqual([id]);
  });

  it('does not mutate inputs while sorting and filtering', () => {
    const before = JSON.stringify(stats);
    for (const record of Object.values(stats.questions)) Object.freeze(record);
    Object.freeze(stats.questions);
    Object.freeze(stats);
    Object.freeze(questions);
    getRecentQuestionStats(stats, questions);
    getStatsSummary(stats, questions);
    getWeakQuestionIds(stats, questions);
    expect(JSON.stringify(stats)).toBe(before);
    expect(questions.map((question) => question.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
  });
});

describe('review with the expanded material', () => {
  it('retains existing weak IDs, ignores unrated additions, and reviews new weak questions in material order', () => {
    const previousMaterial = material.slice(0, 60);
    const oldWeak = previousMaterial[0]!.id;
    const firstNew = material[60]!.id;
    const lastNew = material[74]!.id;
    const timestamp = '2026-10-20T00:00:00.000Z';
    const existing = recordRating(createEmptyStats(), oldWeak, 'unknown', timestamp);
    const original = structuredClone(existing);
    expect(getWeakQuestionIds(existing, material)).toEqual(getWeakQuestionIds(existing, previousMaterial));
    const updated = recordRating(recordRating(existing, lastNew, 'unsure', timestamp), firstNew, 'unknown', timestamp);
    expect(getWeakQuestionIds(updated, material)).toEqual([oldWeak, firstNew, lastNew]);
    expect(getWeakQuestionIds(recordRating(updated, firstNew, 'known', timestamp), material)).toEqual([oldWeak, lastNew]);
    expect(existing).toEqual(original);
  });
});
