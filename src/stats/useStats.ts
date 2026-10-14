import { useRef, useState } from 'react';
import { createBrowserStatsRepository } from './localStorageStatsRepository';
import type { StatsRepository } from './statsRepository';
import { recordRating } from './statsService';
import type { Rating } from './statsTypes';

export function useStats(repository?: StatsRepository) {
  const [repo] = useState(() => repository ?? createBrowserStatsRepository());
  const [stats, setStats] = useState(() => repo.load());
  const latestStats = useRef(stats);
  const [saveFailed, setSaveFailed] = useState(false);

  function record(questionId: string, rating: Rating) {
    const next = recordRating(latestStats.current, questionId, rating, new Date().toISOString());
    latestStats.current = next;
    setStats(next);
    // Persistence is an event side effect, outside React's state updater
    // (which StrictMode may call twice).
    setSaveFailed(!repo.save(next));
  }

  return { stats, record, saveFailed };
}
