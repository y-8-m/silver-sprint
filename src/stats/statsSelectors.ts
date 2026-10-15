import type { Category, Question } from '../data/types';
import type { QuestionStats, Stats } from './statsTypes';

export type StatsSummary = {
  ratedQuestionCount: number;
  unratedQuestionCount: number;
  knownCount: number;
  unsureCount: number;
  unknownCount: number;
  totalRatings: number;
};

export type QuestionStatsView = {
  questionId: string;
  category: Category;
  topic: string;
  stats: QuestionStats | null;
};

type RatedQuestionStatsView = QuestionStatsView & { stats: QuestionStats };

// All selectors use the current material as their base. Orphan stats are
// excluded from counts, totals and lists; the stored records remain untouched.
export function getQuestionStatsViews(stats: Stats, questions: Question[]): QuestionStatsView[] {
  return questions.map((question) => ({
    questionId: question.id,
    category: question.category,
    topic: question.topic,
    stats: Object.hasOwn(stats.questions, question.id) ? stats.questions[question.id] ?? null : null,
  }));
}

function getRatedQuestionStats(stats: Stats, questions: Question[]): RatedQuestionStatsView[] {
  return getQuestionStatsViews(stats, questions).filter((view): view is RatedQuestionStatsView => view.stats !== null);
}

export function getStatsSummary(stats: Stats, questions: Question[]): StatsSummary {
  const rated = getRatedQuestionStats(stats, questions);
  const sum = (pick: (view: RatedQuestionStatsView) => number) => rated.reduce((total, view) => total + pick(view), 0);
  const knownCount = sum((view) => view.stats.knownCount);
  const unsureCount = sum((view) => view.stats.unsureCount);
  const unknownCount = sum((view) => view.stats.unknownCount);
  return {
    ratedQuestionCount: rated.length,
    unratedQuestionCount: questions.length - rated.length,
    knownCount,
    unsureCount,
    unknownCount,
    totalRatings: knownCount + unsureCount + unknownCount,
  };
}

// Material order; these IDs can also supply a future Review Drill sequence.
export function getWeakQuestionIds(stats: Stats, questions: Question[]): string[] {
  return getWeakQuestionStats(stats, questions).map((view) => view.questionId);
}

export function getWeakQuestionStats(stats: Stats, questions: Question[]): RatedQuestionStatsView[] {
  return getRatedQuestionStats(stats, questions)
    .filter((view) => view.stats.lastRating === 'unsure' || view.stats.lastRating === 'unknown');
}

// Most recent per question, not an event history. Equal timestamps retain
// material order. Sorting a fresh array leaves both inputs untouched.
export function getRecentQuestionStats(stats: Stats, questions: Question[], limit = 5): RatedQuestionStatsView[] {
  return getRatedQuestionStats(stats, questions)
    .sort((a, b) => Date.parse(b.stats.lastAnsweredAt) - Date.parse(a.stats.lastAnsweredAt))
    .slice(0, Math.max(0, limit));
}
