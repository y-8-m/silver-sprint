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

export const STATS_BACKUP_STORAGE_KEY = `${STATS_STORAGE_KEY}:backup`;

export function createLocalStorageStatsRepository(storage?: StatsStorage): StatsRepository {
  // Anything dropped on load would be overwritten by the next save, so keep the
  // original text under a separate key. Best effort: a failure here is ignored.
  function backUp(raw: string): void {
    try {
      storage?.setItem(STATS_BACKUP_STORAGE_KEY, raw);
    } catch {
      // Storage is unavailable or full; loading must still succeed.
    }
  }

  return {
    load(): Stats {
      try {
        const raw = storage?.getItem(STATS_STORAGE_KEY);
        if (raw == null) return createEmptyStats();
        let stored: unknown;
        try {
          stored = JSON.parse(raw);
        } catch {
          backUp(raw);
          return createEmptyStats();
        }
        if (!isObject(stored) || !Object.hasOwn(stored, 'version') || stored.version !== 1
          || !Object.hasOwn(stored, 'questions') || !isObject(stored.questions)) {
          backUp(raw);
          return createEmptyStats();
        }
        // Valid records survive even when others are corrupt. Only own entries
        // are loaded; fromEntries also preserves special IDs such as __proto__
        // as ordinary data properties.
        const entries = Object.entries(stored.questions);
        const valid = entries.filter(([, value]) => isQuestionStats(value));
        if (valid.length !== entries.length) backUp(raw);
        return { questions: Object.fromEntries(valid) as Record<string, QuestionStats> };
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
