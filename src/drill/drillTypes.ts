export type DrillPhase = 'ready' | 'question' | 'answer' | 'finished';

export type DrillState = {
  phase: DrillPhase;
  questionIds: string[];
  currentIndex: number;
};

export type DrillAction =
  | { type: 'START' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'NEXT' }
  | { type: 'RESET' };
