export type DrillPhase = 'ready' | 'question' | 'answer' | 'finished';
export type DrillMode = 'all' | 'review';

export type DrillState = {
  phase: DrillPhase;
  questionIds: string[];
  currentIndex: number;
};

export type DrillAction =
  | { type: 'START' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'NEXT' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'RESET'; questionIds?: string[] };
