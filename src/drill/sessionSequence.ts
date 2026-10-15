import type { Question } from '../data/types';

export type Course = 'A' | 'B' | 'C' | 'D' | 'mixed';
export type QuestionOrder = 'sequential' | 'random';
export type SessionSettings = { course: Course; order: QuestionOrder };
// The same [0, 1) range as Math.random.
export type RandomSource = () => number;

export function buildQuestionSequence(
  questions: readonly Question[],
  { course, order }: SessionSettings,
  random: RandomSource = Math.random,
): string[] {
  const questionIds = questions
    .filter((question) => course === 'mixed' || question.category === course)
    .map((question) => question.id);

  if (order === 'random') {
    // Fisher–Yates only swaps this newly created ID array.
    for (let index = questionIds.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [questionIds[index], questionIds[target]] = [questionIds[target]!, questionIds[index]!];
    }
  }

  return questionIds;
}
