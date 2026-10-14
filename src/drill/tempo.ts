import type { DrillPhase } from './drillTypes';

export type Tempo = 'slow' | 'normal' | 'fast';
type TimedPhase = Extract<DrillPhase, 'question' | 'answer'>;

export const TEMPO_CONFIG = {
  slow: { question: 10_000, answer: 10_000 },
  normal: { question: 6_000, answer: 7_000 },
  fast: { question: 3_000, answer: 4_000 },
} as const satisfies Record<Tempo, Record<TimedPhase, number>>;

export function getPhaseDurationMs(tempo: Tempo, phase: TimedPhase, timeWeight = 1): number {
  const duration = TEMPO_CONFIG[tempo][phase] * timeWeight;
  // Invalid weights are not yet rejected by the content validator. Fall back
  // to the base duration rather than immediately skipping or stalling a phase.
  return Number.isFinite(duration) && duration > 0 ? duration : TEMPO_CONFIG[tempo][phase];
}
