import { describe, expect, it } from 'vitest';
import { createInitialDrillState, drillReducer } from './drillReducer';
import type { DrillAction, DrillPhase, DrillState } from './drillTypes';

function stateAt(phase: DrillPhase, currentIndex = 0): DrillState {
  return { ...createInitialDrillState(['q1', 'q2', 'q3']), phase, currentIndex };
}

describe('createInitialDrillState', () => {
  it('starts ready at index zero and copies the supplied sequence', () => {
    const ids = ['q3', 'q1'];
    const state = createInitialDrillState(ids);
    expect(state).toEqual({ phase: 'ready', currentIndex: 0, questionIds: ['q3', 'q1'] });
    expect(state.questionIds).not.toBe(ids);
    ids.push('q2');
    expect(state.questionIds).toEqual(['q3', 'q1']);
  });
});

describe('drillReducer', () => {
  it('starts a nonempty sequence', () => {
    expect(drillReducer(stateAt('ready'), { type: 'START' })).toEqual(stateAt('question'));
  });

  it('reveals the answer without changing the current question', () => {
    expect(drillReducer(stateAt('question', 1), { type: 'REVEAL_ANSWER' })).toEqual(stateAt('answer', 1));
  });

  it('advances from answer to the next question', () => {
    expect(drillReducer(stateAt('answer', 1), { type: 'NEXT' })).toEqual(stateAt('question', 2));
  });

  it('finishes from the last answer without moving out of bounds', () => {
    expect(drillReducer(stateAt('answer', 2), { type: 'NEXT' })).toEqual(stateAt('finished', 2));
  });

  it.each([
    ['question', 1, 'answer', 1],
    ['answer', 1, 'question', 2],
    ['answer', 2, 'finished', 2],
  ] as const)('handles %s at index %i + TIMER_EXPIRED', (phase, index, nextPhase, nextIndex) => {
    expect(drillReducer(stateAt(phase, index), { type: 'TIMER_EXPIRED' })).toEqual(stateAt(nextPhase, nextIndex));
  });

  it.each<DrillPhase>(['question', 'answer', 'finished'])('resets %s to ready at index zero', (phase) => {
    const state = stateAt(phase, 2);
    const reset = drillReducer(state, { type: 'RESET' });
    expect(reset).toEqual(stateAt('ready'));
    expect(reset.questionIds).toBe(state.questionIds);
  });

  it.each<DrillPhase>(['ready', 'question', 'answer', 'finished'])('replaces the sequence on RESET from %s with a copied array', (phase) => {
    const state = stateAt(phase, 2);
    const questionIds = ['q3', 'q1'];
    const reset = drillReducer(state, { type: 'RESET', questionIds });
    expect(reset).toEqual({ phase: 'ready', currentIndex: 0, questionIds: ['q3', 'q1'] });
    expect(reset.questionIds).not.toBe(questionIds);
    questionIds.push('q2');
    expect(reset.questionIds).toEqual(['q3', 'q1']);
    expect(state).toEqual(stateAt(phase, 2));
  });

  it('accepts an empty RESET sequence and cannot start it', () => {
    const reset = drillReducer(stateAt('finished', 2), { type: 'RESET', questionIds: [] });
    expect(reset).toEqual({ phase: 'ready', currentIndex: 0, questionIds: [] });
    expect(drillReducer(reset, { type: 'START' })).toBe(reset);
  });

  it.each<{ phase: DrillPhase; action: DrillAction }>([
    { phase: 'ready', action: { type: 'REVEAL_ANSWER' } },
    { phase: 'ready', action: { type: 'NEXT' } },
    { phase: 'ready', action: { type: 'TIMER_EXPIRED' } },
    { phase: 'question', action: { type: 'START' } },
    { phase: 'question', action: { type: 'NEXT' } },
    { phase: 'answer', action: { type: 'START' } },
    { phase: 'answer', action: { type: 'REVEAL_ANSWER' } },
    { phase: 'finished', action: { type: 'START' } },
    { phase: 'finished', action: { type: 'REVEAL_ANSWER' } },
    { phase: 'finished', action: { type: 'NEXT' } },
    { phase: 'finished', action: { type: 'TIMER_EXPIRED' } },
  ])('ignores $phase + $action.type with the same state reference', ({ phase, action }) => {
    const state = stateAt(phase, phase === 'finished' ? 2 : 0);
    expect(drillReducer(state, action)).toBe(state);
  });

  it('does not start an empty sequence', () => {
    const state = createInitialDrillState([]);
    expect(drillReducer(state, { type: 'START' })).toBe(state);
    expect(state).toEqual({ phase: 'ready', currentIndex: 0, questionIds: [] });
  });

  it('completes a single-question session at index zero', () => {
    let state = createInitialDrillState(['only']);
    state = drillReducer(state, { type: 'START' });
    state = drillReducer(state, { type: 'REVEAL_ANSWER' });
    state = drillReducer(state, { type: 'NEXT' });
    expect(state).toEqual({ phase: 'finished', currentIndex: 0, questionIds: ['only'] });
  });

  it('visits every supplied ID once in order and stays finished on further NEXT', () => {
    const ids = ['q3', 'q1', 'q2'];
    let state = drillReducer(createInitialDrillState(ids), { type: 'START' });
    const visited: string[] = [];
    for (let index = 0; index < ids.length; index++) {
      expect(state.phase).toBe('question');
      visited.push(state.questionIds[state.currentIndex]!);
      state = drillReducer(state, { type: 'REVEAL_ANSWER' });
      state = drillReducer(state, { type: 'NEXT' });
    }
    expect(visited).toEqual(ids);
    expect(state.phase).toBe('finished');
    expect(state.currentIndex).toBe(2);
    expect(drillReducer(state, { type: 'NEXT' })).toBe(state);
  });

  it('does not mutate its input state or sequence', () => {
    const state = stateAt('answer', 1);
    Object.freeze(state.questionIds);
    Object.freeze(state);
    const next = drillReducer(state, { type: 'NEXT' });
    expect(state).toEqual(stateAt('answer', 1));
    expect(next).toEqual(stateAt('question', 2));
    expect(next).not.toBe(state);
  });
});
