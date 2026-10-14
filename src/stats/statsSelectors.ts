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
  return getRatedQuestionStats(stats, questions).reduce<StatsSummary>((summary, view) => ({
    ratedQuestionCount: summary.ratedQuestionCount + 1,
    unratedQuestionCount: summary.unratedQuestionCount - 1,
    knownCount: summary.knownCount + view.stats.knownCount,
    unsureCount: summary.unsureCount + view.stats.unsureCount,
    unknownCount: summary.unknownCount + view.stats.unknownCount,
    totalRatings: summary.totalRatings + view.stats.knownCount + view.stats.unsureCount + view.stats.unknownCount,
  }), { ratedQuestionCount: 0, unratedQuestionCount: questions.length, knownCount: 0, unsureCount: 0, unknownCount: 0, totalRatings: 0 });
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
