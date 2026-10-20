import { useEffect, useRef, useState } from 'react';

type UseDrillTimerOptions = {
  durationMs: number;
  paused: boolean;
  enabled: boolean;
  resetKey: string;
  onExpire(): void;
};

type TimerPeriod = {
  resetKey: string;
  durationMs: number;
  remainingMs: number;
  expired: boolean;
};

export function useDrillTimer({ durationMs, paused, enabled, resetKey, onExpire }: UseDrillTimerOptions) {
  const [remainingMs, setRemainingMs] = useState(enabled ? durationMs : 0);
  const periodRef = useRef<TimerPeriod | null>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!enabled) {
      periodRef.current = null;
      setRemainingMs(0);
      return;
    }

    if (periodRef.current === null || periodRef.current.resetKey !== resetKey || periodRef.current.durationMs !== durationMs) {
      periodRef.current = { resetKey, durationMs, remainingMs: durationMs, expired: false };
    }
    const period = periodRef.current;
    setRemainingMs(period.remainingMs);
    if (paused || period.expired) return;

    const deadline = Date.now() + period.remainingMs;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
    const update = () => {
      period.remainingMs = Math.max(0, deadline - Date.now());
      setRemainingMs(period.remainingMs);
      if (period.remainingMs === 0 && !period.expired) {
        period.expired = true;
        stop();
        onExpireRef.current();
      }
    };

    // The interval refreshes the display; the timeout separately schedules an update at the deadline.
    // Both can be delayed in background tabs, so update calculates remaining time from Date.now().
    // period.expired prevents duplicate expiration handling when either timer runs.
    intervalId = setInterval(update, 100);
    timeoutId = setTimeout(update, period.remainingMs);
    return () => {
      stop();
      // Capture elapsed time between display ticks as well, including on pause.
      period.remainingMs = Math.max(0, deadline - Date.now());
    };
  }, [durationMs, paused, enabled, resetKey]);

  return { remainingMs };
}
