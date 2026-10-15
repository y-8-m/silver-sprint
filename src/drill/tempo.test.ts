import { describe, expect, it } from 'vitest';
import { getPhaseDurationMs } from './tempo';

describe('getPhaseDurationMs', () => {
  it.each([
    ['normal', 'question', 1, 10000],
    ['normal', 'answer', 1, 10000],
    ['normal', 'question', 1.5, 15000],
    ['normal', 'answer', 1.5, 15000],
    ['fast', 'question', 1, 6000],
    ['fast', 'answer', 2, 14000],
    ['slow', 'question', 1, 15000],
    ['slow', 'answer', 1, 15000],
  ] as const)('%s %s × %s = %sms', (tempo, phase, weight, expected) => {
    expect(getPhaseDurationMs(tempo, phase, weight)).toBe(expected);
  });

  it('defaults an undefined weight to one', () => {
    expect(getPhaseDurationMs('normal', 'question')).toBe(10000);
    expect(getPhaseDurationMs('normal', 'answer', undefined)).toBe(10000);
  });

  it.each([0, -1, NaN, Infinity, Number.MAX_VALUE])('falls back to base duration for unsafe weight %s', (weight) => {
    expect(getPhaseDurationMs('normal', 'question', weight)).toBe(10000);
  });
});
