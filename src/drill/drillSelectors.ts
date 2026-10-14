import type { DrillState } from './drillTypes';

export function getCurrentQuestionId(state: DrillState): string | undefined {
  return state.questionIds[state.currentIndex];
}

export function getCurrentQuestionNumber(state: DrillState): number {
  return getCurrentQuestionId(state) === undefined ? 0 : state.currentIndex + 1;
}

export function getTotalQuestions(state: DrillState): number {
  return state.questionIds.length;
}

export function isLastQuestion(state: DrillState): boolean {
  return state.questionIds.length > 0 && state.currentIndex === state.questionIds.length - 1;
}
