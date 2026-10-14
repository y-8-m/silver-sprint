import type { DrillAction, DrillState } from './drillTypes';

export function createInitialDrillState(questionIds: string[]): DrillState {
  return { phase: 'ready', questionIds: [...questionIds], currentIndex: 0 };
}

// READY -> QUESTION -> ANSWER -> QUESTION ... -> FINISHED; RESET -> READY.
// Sequence selection and all side effects belong outside this reducer.
export function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'START':
      return state.phase === 'ready' && state.questionIds.length > 0
        ? { ...state, phase: 'question' }
        : state;
    case 'REVEAL_ANSWER':
      return state.phase === 'question' ? { ...state, phase: 'answer' } : state;
    case 'NEXT':
      if (state.phase !== 'answer') return state;
      return state.currentIndex < state.questionIds.length - 1
        ? { ...state, phase: 'question', currentIndex: state.currentIndex + 1 }
        : { ...state, phase: 'finished' };
    case 'TIMER_EXPIRED':
      if (state.phase === 'question') return drillReducer(state, { type: 'REVEAL_ANSWER' });
      if (state.phase === 'answer') return drillReducer(state, { type: 'NEXT' });
      return state;
    case 'RESET':
      return { ...state, phase: 'ready', currentIndex: 0 };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
