import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Rating } from '../stats/statsTypes';

export type DrillKeyHandlers = {
  /** Space */
  onTogglePause(): void;
  /** Enter: reveal the answer, or move on without rating. */
  onPrimary(): void;
  /** 1 / 2 / 3, answer phase only. */
  onRate(rating: Rating): void;
};

const RATING_KEYS = { '1': 'known', '2': 'unsure', '3': 'unknown' } as const satisfies Record<string, Rating>;

const TEXT_ENTRY = 'input, textarea, select, dialog, [contenteditable=""], [contenteditable="true"]';
const ACTIVATABLE = 'button, a[href], summary';

export function useDrillKeys(enabled: boolean, answering: boolean, handlers: DrillKeyHandlers): void {
  const latest = useRef({ answering, handlers });

  useLayoutEffect(() => {
    latest.current = { answering, handlers };
  }, [answering, handlers]);

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(TEXT_ENTRY)) return;
      const { answering: isAnswering, handlers: current } = latest.current;
      if (event.key === ' ' || event.key === 'Enter') {
        // A focused button or link already turns these keys into its own click.
        if (target?.closest(ACTIVATABLE)) return;
        event.preventDefault();
        if (event.key === ' ') current.onTogglePause();
        else current.onPrimary();
        return;
      }
      if (isAnswering && Object.hasOwn(RATING_KEYS, event.key)) {
        event.preventDefault();
        current.onRate(RATING_KEYS[event.key as keyof typeof RATING_KEYS]);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
