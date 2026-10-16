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
  it('falls back to defaults when nothing is stored, unparsable, or storage is missing', () => {
    expect(loadDrillPreferences(memoryStorage())).toEqual(DEFAULT_DRILL_PREFERENCES);
    expect(loadDrillPreferences(memoryStorage('{oops'))).toEqual(DEFAULT_DRILL_PREFERENCES);
    expect(loadDrillPreferences(memoryStorage('[]'))).toEqual(DEFAULT_DRILL_PREFERENCES);
    expect(loadDrillPreferences(undefined)).toEqual(DEFAULT_DRILL_PREFERENCES);
  });

  it('falls back per field and ignores inherited property names', () => {
    expect(loadDrillPreferences(memoryStorage('{"order":"random","tempo":"turbo"}'))).toEqual({ order: 'random', tempo: 'normal' });
    expect(loadDrillPreferences(memoryStorage('{"order":"x","tempo":"constructor"}'))).toEqual(DEFAULT_DRILL_PREFERENCES);
  });

  it('round-trips and survives a failing setItem', () => {
    const storage = memoryStorage();
    saveDrillPreferences({ order: 'random', tempo: 'fast' }, storage);
    expect(loadDrillPreferences(storage)).toEqual({ order: 'random', tempo: 'fast' });
    expect(() => saveDrillPreferences(DEFAULT_DRILL_PREFERENCES, {
      getItem: () => null,
      setItem: () => { throw new Error('full'); },
    })).not.toThrow();
  });
});

describe('drill launch', () => {
  it('builds a path that parses back to the same settings', () => {
    const path = buildDrillPath('C', { order: 'random', tempo: 'slow' });
    expect(path).toBe('/drill?course=C&order=random&tempo=slow');
    expect(parseDrillLaunch(new URLSearchParams(path.split('?')[1]))).toEqual({
      settings: { course: 'C', order: 'random' },
      tempo: 'slow',
    });
  });

  it('does not launch without a valid course and defaults invalid order / tempo', () => {
    expect(parseDrillLaunch(new URLSearchParams(''))).toBeNull();
    expect(parseDrillLaunch(new URLSearchParams('course=Z'))).toBeNull();
    expect(parseDrillLaunch(new URLSearchParams('course=mixed&order=x&tempo=toString'))).toEqual({
      settings: { course: 'mixed', order: 'sequential' },
      tempo: 'normal',
    });
  });
});
