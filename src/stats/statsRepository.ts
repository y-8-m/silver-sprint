import type { Stats } from './statsTypes';

export interface StatsRepository {
  load(): Stats;
  save(stats: Stats): boolean;
  clear(): boolean;
}
