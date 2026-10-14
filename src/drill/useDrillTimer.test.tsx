// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDrillTimer } from './useDrillTimer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup() {
  const onExpire = vi.fn();
  const options = { durationMs: 1000, paused: false, enabled: true, resetKey: 'first', onExpire };
  const hook = renderHook(useDrillTimer, { initialProps: options, wrapper: StrictMode });
  return { ...hook, options, onExpire };
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

describe('useDrillTimer', () => {
  it('counts down and expires once even in StrictMode', () => {
    const { result, onExpire } = setup();
    expect(result.current.remainingMs).toBe(1000);
    advance(400);
    expect(result.current.remainingMs).toBe(600);
    advance(600);
    expect(result.current.remainingMs).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
    advance(5000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('holds the exact remainder on pause and resumes from it', () => {
    const { result, rerender, options, onExpire } = setup();
    advance(450);
    rerender({ ...options, paused: true });
    expect(result.current.remainingMs).toBe(550);
    advance(5000);
    expect(result.current.remainingMs).toBe(550);
    expect(onExpire).not.toHaveBeenCalled();
    rerender(options);
    advance(500);
    expect(result.current.remainingMs).toBe(50);
    advance(50);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('resets on key or duration changes and cancels the previous deadline', () => {
    const { result, rerender, options, onExpire } = setup();
    advance(500);
    rerender({ ...options, resetKey: 'second' });
    expect(result.current.remainingMs).toBe(1000);
    advance(500);
    expect(onExpire).not.toHaveBeenCalled();
    rerender({ ...options, resetKey: 'second', durationMs: 2000 });
    expect(result.current.remainingMs).toBe(2000);
    advance(2000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    rerender({ ...options, resetKey: 'third' });
    advance(1000);
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('stops when disabled and starts a fresh period when enabled again', () => {
    const { result, rerender, options, onExpire } = setup();
    advance(400);
    rerender({ ...options, enabled: false });
    expect(result.current.remainingMs).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    advance(5000);
    expect(onExpire).not.toHaveBeenCalled();
    rerender(options);
    expect(result.current.remainingMs).toBe(1000);
    advance(1000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('uses the latest callback without resetting the timer', () => {
    const { rerender, options, onExpire } = setup();
    advance(400);
    const latest = vi.fn();
    rerender({ ...options, onExpire: latest });
    advance(600);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('uses the actual deadline after a delayed tick', () => {
    const { result, onExpire } = setup();
    act(() => vi.setSystemTime(Date.now() + 2000));
    advance(100);
    expect(result.current.remainingMs).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('cleans up on unmount', () => {
    const { unmount, onExpire } = setup();
    advance(300);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    advance(5000);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
