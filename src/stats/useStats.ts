import { useRef, useState } from 'react';
import { createBrowserStatsRepository } from './localStorageStatsRepository';
import type { StatsRepository } from './statsRepository';
import { recordRating } from './statsService';
import { createEmptyStats } from './statsTypes';
import type { Rating } from './statsTypes';

export function useStats(repository?: StatsRepository) {
  const [repo] = useState(() => repository ?? createBrowserStatsRepository());
  const [stats, setStats] = useState(() => repo.load());
  const latestStats = useRef(stats);
  const [storageError, setStorageError] = useState<'save' | 'clear' | null>(null);

  function record(questionId: string, rating: Rating) {
    const next = recordRating(latestStats.current, questionId, rating, new Date().toISOString());
    latestStats.current = next;
    setStats(next);
    // Persistence is an event side effect, outside React's state updater
    // (which StrictMode may call twice).
    setStorageError(repo.save(next) ? null : 'save');
  }

  function clear() {
    const empty = createEmptyStats();
    latestStats.current = empty;
    setStats(empty);
    setStorageError(repo.clear() ? null : 'clear');
  }

  return { stats, record, clear, saveFailed: storageError === 'save', clearFailed: storageError === 'clear' };
}
