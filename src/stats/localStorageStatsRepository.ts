import type { StatsRepository } from './statsRepository';
import { createEmptyStats } from './statsTypes';
import type { QuestionStats, Stats } from './statsTypes';

export const STATS_STORAGE_KEY = 'silverSprint:v1:stats';

type StoredStatsV1 = { version: 1; questions: Record<string, QuestionStats> };
type StatsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isQuestionStats(value: unknown): value is QuestionStats {
  if (!isObject(value)) return false;
  const fields = ['knownCount', 'unsureCount', 'unknownCount', 'lastRating', 'lastAnsweredAt'];
  if (!fields.every((field) => Object.hasOwn(value, field))) return false;
  return ['knownCount', 'unsureCount', 'unknownCount'].every((field) => (
    typeof value[field] === 'number' && Number.isSafeInteger(value[field]) && value[field] >= 0
  )) && (value.lastRating === 'known' || value.lastRating === 'unsure' || value.lastRating === 'unknown')
    && typeof value.lastAnsweredAt === 'string' && Number.isFinite(Date.parse(value.lastAnsweredAt));
}

export function createLocalStorageStatsRepository(storage?: StatsStorage): StatsRepository {
  return {
    load(): Stats {
      try {
        const raw = storage?.getItem(STATS_STORAGE_KEY);
        if (raw == null) return createEmptyStats();
        const stored: unknown = JSON.parse(raw);
        if (!isObject(stored) || !Object.hasOwn(stored, 'version') || stored.version !== 1
          || !Object.hasOwn(stored, 'questions') || !isObject(stored.questions)) return createEmptyStats();
        const entries = Object.entries(stored.questions);
        if (!entries.every(([, value]) => isQuestionStats(value))) return createEmptyStats();
        // Only own entries are loaded; fromEntries also preserves special IDs
        // such as __proto__ as ordinary data properties.
        return { questions: Object.fromEntries(entries) as Record<string, QuestionStats> };
      } catch {
        return createEmptyStats();
      }
    },
    save(stats): boolean {
      try {
        if (!storage) return false;
        const stored: StoredStatsV1 = { version: 1, questions: stats.questions };
        storage.setItem(STATS_STORAGE_KEY, JSON.stringify(stored));
        return true;
      } catch {
        return false;
      }
    },
    clear(): boolean {
      try {
        if (!storage) return false;
        storage.removeItem(STATS_STORAGE_KEY);
        return true;
      } catch {
        return false;
      }
    },
  };
}

// Called at component initialization, never during module import. The getter
// itself can throw (SecurityError), even before any storage method is invoked.
export function createBrowserStatsRepository(): StatsRepository {
  try {
    return createLocalStorageStatsRepository(window.localStorage);
  } catch {
    return createLocalStorageStatsRepository();
  }
}
