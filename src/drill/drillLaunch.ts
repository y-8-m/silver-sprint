import type { Course, QuestionOrder, SessionSettings } from './sessionSequence';
import { TEMPO_CONFIG } from './tempo';
import type { Tempo } from './tempo';

// Home -> Drill handoff (query string) and the last-used order / tempo.
export type DrillPreferences = { order: QuestionOrder; tempo: Tempo };

export const DEFAULT_DRILL_PREFERENCES: DrillPreferences = { order: 'sequential', tempo: 'normal' };
export const DRILL_PREFERENCES_STORAGE_KEY = 'silverSprint:v1:drillPreferences';

type PreferencesStorage = Pick<Storage, 'getItem' | 'setItem'>;

const COURSES: readonly Course[] = ['A', 'B', 'C', 'D', 'mixed'];
const ORDERS: readonly QuestionOrder[] = ['sequential', 'random'];

function isCourse(value: unknown): value is Course {
  return typeof value === 'string' && (COURSES as readonly string[]).includes(value);
}

function isOrder(value: unknown): value is QuestionOrder {
  return typeof value === 'string' && (ORDERS as readonly string[]).includes(value);
}

function isTempo(value: unknown): value is Tempo {
  return typeof value === 'string' && Object.hasOwn(TEMPO_CONFIG, value);
}

function browserStorage(): PreferencesStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

// Each field falls back to its default on its own, so one bad value keeps the other.
export function loadDrillPreferences(storage: PreferencesStorage | undefined = browserStorage()): DrillPreferences {
  try {
    const raw = storage?.getItem(DRILL_PREFERENCES_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_DRILL_PREFERENCES };
    const record = parsed as Record<string, unknown>;
    return {
      order: isOrder(record.order) ? record.order : DEFAULT_DRILL_PREFERENCES.order,
      tempo: isTempo(record.tempo) ? record.tempo : DEFAULT_DRILL_PREFERENCES.tempo,
    };
  } catch {
    return { ...DEFAULT_DRILL_PREFERENCES };
  }
}

// Best effort: a full or unavailable storage must not interrupt the Home screen.
export function saveDrillPreferences(
  preferences: DrillPreferences,
  storage: PreferencesStorage | undefined = browserStorage(),
): void {
  try {
    storage?.setItem(DRILL_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Not persisted; the in-memory selection still applies to this launch.
  }
}

export function buildDrillPath(course: Course, preferences: DrillPreferences): string {
  const params = new URLSearchParams({ course, order: preferences.order, tempo: preferences.tempo });
  return `/drill?${params.toString()}`;
}

// A valid `course` means "start now"; without it the Drill keeps its ready screen.
export function parseDrillLaunch(params: URLSearchParams): { settings: SessionSettings; tempo: Tempo } | null {
  const course = params.get('course');
  if (!isCourse(course)) return null;
  const order = params.get('order');
  const tempo = params.get('tempo');
  return {
    settings: { course, order: isOrder(order) ? order : DEFAULT_DRILL_PREFERENCES.order },
    tempo: isTempo(tempo) ? tempo : DEFAULT_DRILL_PREFERENCES.tempo,
  };
}
