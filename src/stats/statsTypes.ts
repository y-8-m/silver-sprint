export type Rating = 'known' | 'unsure' | 'unknown';

export type QuestionStats = {
  knownCount: number;
  unsureCount: number;
  unknownCount: number;
  lastRating: Rating;
  lastAnsweredAt: string;
};

export type Stats = {
  questions: Record<string, QuestionStats>;
};

export function createEmptyStats(): Stats {
  return { questions: {} };
}
