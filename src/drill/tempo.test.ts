import { describe, expect, it } from 'vitest';
import { getPhaseDurationMs } from './tempo';

describe('getPhaseDurationMs', () => {
  it.each([
    ['normal', 'question', 1, 6000],
    ['normal', 'answer', 1, 7000],
    ['normal', 'question', 1.5, 9000],
    ['normal', 'answer', 1.5, 10500],
    ['fast', 'question', 1, 3000],
    ['fast', 'answer', 2, 8000],
    ['slow', 'question', 1, 10000],
    ['slow', 'answer', 1, 10000],
  ] as const)('%s %s × %s = %sms', (tempo, phase, weight, expected) => {
    expect(getPhaseDurationMs(tempo, phase, weight)).toBe(expected);
  });

  it('defaults an undefined weight to one', () => {
    expect(getPhaseDurationMs('normal', 'question')).toBe(6000);
    expect(getPhaseDurationMs('normal', 'answer', undefined)).toBe(7000);
  });

  it.each([0, -1, NaN, Infinity, Number.MAX_VALUE])('falls back to base duration for unsafe weight %s', (weight) => {
    expect(getPhaseDurationMs('normal', 'question', weight)).toBe(6000);
  });
});
