import type { Rating, Stats } from './statsTypes';

export function recordRating(stats: Stats, questionId: string, rating: Rating, answeredAt: string): Stats {
  const previous = Object.hasOwn(stats.questions, questionId) ? stats.questions[questionId] : undefined;
  return {
    questions: {
      ...stats.questions,
      [questionId]: {
        knownCount: (previous?.knownCount ?? 0) + (rating === 'known' ? 1 : 0),
        unsureCount: (previous?.unsureCount ?? 0) + (rating === 'unsure' ? 1 : 0),
        unknownCount: (previous?.unknownCount ?? 0) + (rating === 'unknown' ? 1 : 0),
        lastRating: rating,
        lastAnsweredAt: answeredAt,
      },
    },
  };
}
