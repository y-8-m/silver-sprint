import { describe, expect, it } from 'vitest';
import { formatAnsweredAt, getRatingLabel } from './statsFormatting';

describe('Stats formatting', () => {
  it.each([
    ['known', '○ 分かった'], ['unsure', '△ 怪しい'], ['unknown', '× 分からなかった'],
  ] as const)('labels %s as %s', (rating, expected) => {
    expect(getRatingLabel(rating)).toBe(expected);
  });

  it('formats ISO timestamps in Japanese with a fixed Tokyo timezone', () => {
    expect(formatAnsweredAt('2026-10-14T17:00:00.000Z')).toBe('2026/10/15 02:00:00');
    expect(formatAnsweredAt('2026-10-15T00:00:00.000Z')).toBe('2026/10/15 09:00:00');
  });
});
