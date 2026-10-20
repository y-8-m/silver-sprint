import { describe, expect, it } from 'vitest';
import {
  buildDrillPath,
  DEFAULT_DRILL_PREFERENCES,
  DRILL_PREFERENCES_STORAGE_KEY,
  loadDrillPreferences,
  parseDrillLaunch,
  saveDrillPreferences,
} from './drillLaunch';

function memoryStorage(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[DRILL_PREFERENCES_STORAGE_KEY, initial]]);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}

describe('drill preferences', () => {
  it('retains old order and tempo values while defaulting a missing count to all', () => {
    expect(loadDrillPreferences(memoryStorage('{"order":"random","tempo":"fast"}')))
      .toEqual({ order: 'random', tempo: 'fast', questionCount: 'all' });
  });

  it.each([5, 10, 15, 'all'] as const)('persists count %s using the existing storage key', (questionCount) => {
    const storage = memoryStorage();
    const preferences = { order: 'random', tempo: 'fast', questionCount } as const;
    saveDrillPreferences(preferences, storage);
    expect(JSON.parse(storage.getItem(DRILL_PREFERENCES_STORAGE_KEY)!)).toEqual(preferences);
    expect(loadDrillPreferences(storage)).toEqual(preferences);
  });

  it.each([null, 0, -5, 3, 20, 5.5, '10', 'ALL', false, [], {}])('defaults only an invalid count (%j)', (questionCount) => {
    expect(loadDrillPreferences(memoryStorage(JSON.stringify({ order: 'random', tempo: 'fast', questionCount }))))
      .toEqual({ order: 'random', tempo: 'fast', questionCount: 'all' });
  });

  it('survives inaccessible storage', () => {
    expect(loadDrillPreferences({ getItem: () => { throw new Error('denied'); }, setItem: () => {} }))
      .toEqual(DEFAULT_DRILL_PREFERENCES);
  });

  it('falls back to defaults when nothing is stored, unparsable, or storage is missing', () => {
    expect(loadDrillPreferences(memoryStorage())).toEqual(DEFAULT_DRILL_PREFERENCES);
    expect(loadDrillPreferences(memoryStorage('{oops'))).toEqual(DEFAULT_DRILL_PREFERENCES);
    expect(loadDrillPreferences(memoryStorage('[]'))).toEqual(DEFAULT_DRILL_PREFERENCES);
    expect(loadDrillPreferences(undefined)).toEqual(DEFAULT_DRILL_PREFERENCES);
  });

  it('falls back per field and ignores inherited property names', () => {
    expect(loadDrillPreferences(memoryStorage('{"order":"random","tempo":"turbo"}'))).toEqual({ order: 'random', tempo: 'normal', questionCount: 'all' });
    expect(loadDrillPreferences(memoryStorage('{"order":"x","tempo":"constructor"}'))).toEqual(DEFAULT_DRILL_PREFERENCES);
  });

  it('round-trips and survives a failing setItem', () => {
    const storage = memoryStorage();
    saveDrillPreferences({ order: 'random', tempo: 'fast', questionCount: 'all' }, storage);
    expect(loadDrillPreferences(storage)).toEqual({ order: 'random', tempo: 'fast', questionCount: 'all' });
    expect(() => saveDrillPreferences(DEFAULT_DRILL_PREFERENCES, {
      getItem: () => null,
      setItem: () => { throw new Error('full'); },
    })).not.toThrow();
  });
});

describe('drill launch', () => {
  it.each([5, 10, 15, 'all'] as const)('round-trips URL count %s into session generation settings', (questionCount) => {
    const path = buildDrillPath('mixed', { order: 'random', tempo: 'normal', questionCount });
    expect(parseDrillLaunch(new URLSearchParams(path.split('?')[1]))?.settings)
      .toEqual({ course: 'mixed', order: 'random', questionCount });
  });

  it.each(['', '&count=0', '&count=20', '&count=-5', '&count=5.5', '&count=05', '&count=10oops', '&count=NaN'])('uses all for an old URL or invalid count: %s', (query) => {
    expect(parseDrillLaunch(new URLSearchParams(`course=mixed&order=random&tempo=fast${query}`)))
      .toEqual({ settings: { course: 'mixed', order: 'random', questionCount: 'all' }, tempo: 'fast' });
  });

  it('builds a path that parses back to the same settings', () => {
    const path = buildDrillPath('C', { order: 'random', tempo: 'slow', questionCount: 10 });
    expect(path).toBe('/drill?course=C&order=random&tempo=slow&count=10');
    expect(parseDrillLaunch(new URLSearchParams(path.split('?')[1]))).toEqual({
      settings: { course: 'C', order: 'random', questionCount: 10 },
      tempo: 'slow',
    });
  });

  it('does not launch without a valid course and defaults invalid order / tempo', () => {
    expect(parseDrillLaunch(new URLSearchParams(''))).toBeNull();
    expect(parseDrillLaunch(new URLSearchParams('course=Z'))).toBeNull();
    expect(parseDrillLaunch(new URLSearchParams('course=mixed&order=x&tempo=toString'))).toEqual({
      settings: { course: 'mixed', order: 'sequential', questionCount: 'all' },
      tempo: 'normal',
    });
  });
});
