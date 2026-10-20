import type { Question } from '../data/types';

export type Course = 'A' | 'B' | 'C' | 'D' | 'mixed';
export type QuestionOrder = 'sequential' | 'random';
export const QUESTION_COUNTS = [5, 10, 15, 'all'] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];
export type SessionSettings = { course: Course; order: QuestionOrder; questionCount: QuestionCount };
// The same [0, 1) range as Math.random.
export type RandomSource = () => number;

export function buildQuestionSequence(
  questions: readonly Question[],
  { course, order, questionCount }: SessionSettings,
  random: RandomSource = Math.random,
): string[] {
  const questionIds = questions
    .filter((question) => course === 'mixed' || question.category === course)
    .map((question) => question.id);

  if (order === 'sequential' && questionCount === 'all') return questionIds;

  // Sample without replacement from the entire course, independently of order.
  const shuffled = [...questionIds];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
  }

  const selected = questionCount === 'all' ? shuffled : shuffled.slice(0, questionCount);
  if (order === 'random') return selected;

  // Restore material definition order only after choosing the sample.
  const selectedIds = new Set(selected);
  return questionIds.filter((id) => selectedIds.has(id));
}
