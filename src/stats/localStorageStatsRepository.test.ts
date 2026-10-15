import { describe, expect, it, vi } from 'vitest';
import { createBrowserStatsRepository, createLocalStorageStatsRepository, STATS_BACKUP_STORAGE_KEY, STATS_STORAGE_KEY } from './localStorageStatsRepository';
import { recordRating } from './statsService';
import { createEmptyStats } from './statsTypes';

const date = '2026-10-15T00:00:00.000Z';
const stats = recordRating(createEmptyStats(), 'q1', 'known', date);

function setup(raw?: string) {
  const data = new Map<string, string>(raw === undefined ? [] : [[STATS_STORAGE_KEY, raw]]);
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }),
  };
  return { storage, data, repository: createLocalStorageStatsRepository(storage) };
}

describe('localStorage Stats repository', () => {
  it('loads independent empty stats when nothing is saved', () => {
    const { repository } = setup();
    const first = repository.load();
    expect(first).toEqual(createEmptyStats());
    expect(first.questions).not.toBe(repository.load().questions);
  });

  it('round-trips versioned stats using only the specified key', () => {
    const { repository, storage, data } = setup();
    expect(repository.save(stats)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('silverSprint:v1:stats', JSON.stringify({ version: 1, questions: stats.questions }));
    expect(repository.load()).toEqual(stats);
    expect([...data.keys()]).toEqual([STATS_STORAGE_KEY]);
  });

  it.each([
    '{ invalid json', 'null', '[]', '1',
    JSON.stringify({ version: 999, questions: stats.questions }),
    JSON.stringify({ questions: stats.questions }),
    JSON.stringify({ version: 1, questions: null }),
    JSON.stringify({ version: 1, questions: [] }),
    JSON.stringify({ version: 1, questions: { q1: null } }),
    JSON.stringify({ version: 1, questions: { q1: {} } }),
  ])('falls back safely for invalid data: %s', (raw) => {
    expect(setup(raw).repository.load()).toEqual(createEmptyStats());
  });

  it.each([
    { knownCount: -1 }, { unsureCount: 0.5 }, { unknownCount: '1' },
    { knownCount: Number.MAX_SAFE_INTEGER + 1 },
    { lastRating: '○ 分かった' }, { lastAnsweredAt: 'invalid' }, { lastAnsweredAt: null },
  ])('validates each question record: %j', (patch) => {
    const raw = JSON.stringify({ version: 1, questions: { q1: { ...stats.questions.q1, ...patch } } });
    expect(setup(raw).repository.load()).toEqual(createEmptyStats());
  });

  it('keeps valid records and backs up the original when only some records are corrupt', () => {
    const raw = JSON.stringify({ version: 1, questions: { good: stats.questions.q1, bad: { knownCount: -1 } } });
    const { repository, data } = setup(raw);
    expect(Object.keys(repository.load().questions)).toEqual(['good']);
    expect(data.get(STATS_BACKUP_STORAGE_KEY)).toBe(raw);
  });

  it.each([
    '{ invalid json',
    JSON.stringify({ version: 999, questions: stats.questions }),
  ])('backs up unreadable or unsupported data before it can be overwritten: %s', (raw) => {
    const { repository, data } = setup(raw);
    expect(repository.load()).toEqual(createEmptyStats());
    expect(data.get(STATS_BACKUP_STORAGE_KEY)).toBe(raw);
    repository.save(stats);
    expect(data.get(STATS_BACKUP_STORAGE_KEY)).toBe(raw);
  });

  it('does not write a backup for valid or missing data', () => {
    const { repository, storage } = setup(JSON.stringify({ version: 1, questions: stats.questions }));
    repository.load();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(setup().storage.setItem).not.toHaveBeenCalled();
  });

  it('still loads when the backup cannot be written', () => {
    const { repository, storage } = setup('{ invalid json');
    storage.setItem.mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    expect(repository.load()).toEqual(createEmptyStats());
  });

  it('returns empty stats when getItem throws', () => {
    const { repository, storage } = setup();
    storage.getItem.mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    expect(repository.load()).toEqual(createEmptyStats());
  });

  it.each(['QuotaExceededError', 'SecurityError'])('returns false when save throws %s', (name) => {
    const { repository, storage } = setup();
    storage.setItem.mockImplementation(() => { throw new DOMException('Failed', name); });
    expect(repository.save(stats)).toBe(false);
  });

  it('clears only stats and handles removeItem failure', () => {
    const { repository, storage, data } = setup();
    repository.save(stats);
    data.set('unrelated', 'keep');
    expect(repository.clear()).toBe(true);
    expect(repository.load()).toEqual(createEmptyStats());
    expect(data.get('unrelated')).toBe('keep');
    storage.removeItem.mockImplementation(() => { throw new Error('Blocked'); });
    expect(repository.clear()).toBe(false);
  });

  it.each(['constructor', 'toString', '__proto__'])('round-trips own ID %s without inherited records', (id) => {
    const { repository } = setup();
    const special = recordRating(createEmptyStats(), id, 'unsure', date);
    repository.save(special);
    const loaded = repository.load();
    expect(Object.keys(loaded.questions)).toEqual([id]);
    expect(Object.hasOwn(loaded.questions, id)).toBe(true);
    expect(loaded.questions[id]?.unsureCount).toBe(1);
    expect(Object.getPrototypeOf(loaded.questions)).toBe(Object.prototype);
  });

  it('works without browser storage or a window global', () => {
    const repository = createBrowserStatsRepository();
    expect(repository.load()).toEqual(createEmptyStats());
    expect(repository.save(stats)).toBe(false);
    expect(repository.clear()).toBe(false);
  });
});
