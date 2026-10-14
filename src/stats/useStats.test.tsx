// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStatsRepository } from './localStorageStatsRepository';
import { createEmptyStats } from './statsTypes';
import { useStats } from './useStats';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('useStats', () => {
  it('clears memory and storage immediately and starts fresh on the next rating', () => {
    const repository = createLocalStorageStatsRepository(window.localStorage);
    const clear = vi.spyOn(repository, 'clear');
    const { result } = renderHook(() => useStats(repository), { wrapper: StrictMode });
    act(() => result.current.record('q1', 'unknown'));
    act(() => result.current.clear());
    expect(clear).toHaveBeenCalledTimes(1);
    expect(result.current.stats).toEqual(createEmptyStats());
    expect(repository.load()).toEqual(createEmptyStats());
    expect(result.current.clearFailed).toBe(false);
    act(() => result.current.record('q2', 'known'));
    expect(Object.keys(repository.load().questions)).toEqual(['q2']);
  });

  it('empties memory even if clear fails and resets the error on the next successful operation', () => {
    const repository = { load: createEmptyStats, save: vi.fn(() => false), clear: vi.fn(() => false) };
    const { result } = renderHook(() => useStats(repository));
    act(() => result.current.record('q1', 'known'));
    expect(result.current.saveFailed).toBe(true);
    act(() => result.current.clear());
    expect(result.current.stats).toEqual(createEmptyStats());
    expect(result.current.saveFailed).toBe(false);
    expect(result.current.clearFailed).toBe(true);
    repository.clear.mockReturnValue(true);
    act(() => result.current.clear());
    expect(result.current.clearFailed).toBe(false);
  });

  it('loads only at initialization and saves once per event in StrictMode', () => {
    const repository = { load: vi.fn(createEmptyStats), save: vi.fn(() => true), clear: vi.fn(() => true) };
    const { result, rerender } = renderHook(() => useStats(repository), { wrapper: StrictMode });
    const initialLoads = repository.load.mock.calls.length;
    rerender();
    act(() => result.current.record('q1', 'known'));
    expect(repository.load).toHaveBeenCalledTimes(initialLoads);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result.current.stats.questions.q1?.knownCount).toBe(1);
    expect(Number.isFinite(Date.parse(result.current.stats.questions.q1!.lastAnsweredAt))).toBe(true);
  });

  it('keeps memory updates on save failure and saves accumulated counts on recovery', () => {
    const repository = { load: createEmptyStats, save: vi.fn(() => false), clear: () => true };
    const { result } = renderHook(() => useStats(repository));
    act(() => result.current.record('q1', 'known'));
    expect(result.current.saveFailed).toBe(true);
    expect(result.current.stats.questions.q1?.knownCount).toBe(1);
    repository.save.mockReturnValue(true);
    act(() => result.current.record('q1', 'unsure'));
    expect(result.current.saveFailed).toBe(false);
    expect(result.current.stats.questions.q1).toMatchObject({ knownCount: 1, unsureCount: 1 });
    expect(repository.save).toHaveBeenLastCalledWith(result.current.stats);
  });

  it('loads persisted stats again after unmount and remount', () => {
    const repository = createLocalStorageStatsRepository(window.localStorage);
    const first = renderHook(() => useStats(repository));
    act(() => first.result.current.record('q1', 'unknown'));
    first.unmount();
    const second = renderHook(() => useStats(repository));
    expect(second.result.current.stats.questions.q1?.unknownCount).toBe(1);
    act(() => second.result.current.record('q1', 'known'));
    expect(repository.load().questions.q1).toMatchObject({ knownCount: 1, unknownCount: 1 });
  });

  it('handles a throwing localStorage getter without crashing', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const { result } = renderHook(() => useStats());
    act(() => result.current.record('q1', 'known'));
    expect(result.current.saveFailed).toBe(true);
    expect(result.current.stats.questions.q1?.knownCount).toBe(1);
  });
});
