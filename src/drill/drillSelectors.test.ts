import { describe, expect, it } from 'vitest';
import { createInitialDrillState } from './drillReducer';
import { getCurrentQuestionId, getCurrentQuestionNumber, getTotalQuestions, isLastQuestion } from './drillSelectors';

describe('drill selectors', () => {
  it.each([
    { index: 0, id: 'q1', number: 1, last: false },
    { index: 1, id: 'q2', number: 2, last: false },
    { index: 2, id: 'q3', number: 3, last: true },
  ])('selects the current position at index $index', ({ index, id, number, last }) => {
    const state = { ...createInitialDrillState(['q1', 'q2', 'q3']), currentIndex: index };
    expect(getCurrentQuestionId(state)).toBe(id);
    expect(getCurrentQuestionNumber(state)).toBe(number);
    expect(getTotalQuestions(state)).toBe(3);
    expect(isLastQuestion(state)).toBe(last);
  });

  it('handles an empty sequence', () => {
    const state = createInitialDrillState([]);
    expect(getCurrentQuestionId(state)).toBeUndefined();
    expect(getCurrentQuestionNumber(state)).toBe(0);
    expect(getTotalQuestions(state)).toBe(0);
    expect(isLastQuestion(state)).toBe(false);
  });

  it('treats the only question as the last question', () => {
    expect(isLastQuestion(createInitialDrillState(['only']))).toBe(true);
  });
});
