// @vitest-environment jsdom
import { startTransition, StrictMode, Suspense } from 'react';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDrillKeys } from './useDrillKeys';
import type { DrillKeyHandlers } from './useDrillKeys';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const handlers = (): DrillKeyHandlers => ({ onTogglePause: vi.fn(), onPrimary: vi.fn(), onRate: vi.fn() });
const press = (key: string) => fireEvent.keyDown(document.body, { key });

describe('useDrillKeys', () => {
  it('keeps one listener across committed updates in StrictMode and cleans up when disabled or unmounted', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const registrations = () => add.mock.calls.filter(([type]) => type === 'keydown').length;
    const removals = () => remove.mock.calls.filter(([type]) => type === 'keydown').length;
    const initial = { enabled: true, answering: false, handlers: handlers() };
    const { rerender, unmount } = renderHook(
      (props: typeof initial) => useDrillKeys(props.enabled, props.answering, props.handlers),
      { initialProps: initial, wrapper: StrictMode },
    );
    const mountedRegistrations = registrations();
    expect(mountedRegistrations - removals()).toBe(1);
    const latest = { ...initial, answering: true, handlers: handlers() };
    rerender(latest);
    expect(registrations()).toBe(mountedRegistrations);
    press('Enter');
    press('1');
    expect(initial.handlers.onPrimary).not.toHaveBeenCalled();
    expect(latest.handlers.onPrimary).toHaveBeenCalledTimes(1);
    expect(latest.handlers.onRate).toHaveBeenCalledExactlyOnceWith('known');
    rerender({ ...latest, enabled: false });
    expect(registrations() - removals()).toBe(0);
    press('Enter');
    expect(latest.handlers.onPrimary).toHaveBeenCalledTimes(1);
    rerender(latest);
    expect(registrations() - removals()).toBe(1);
    unmount();
    expect(registrations() - removals()).toBe(0);
    press('Enter');
    expect(latest.handlers.onPrimary).toHaveBeenCalledTimes(1);
  });

  it('uses the committed answering state and handlers while a new render is suspended', () => {
    const committed = handlers();
    const pending = handlers();
    const suspended = vi.fn();
    const neverResolves = new Promise<void>(() => {});
    function Probe({ answering, callbacks, suspend }: { answering: boolean; callbacks: DrillKeyHandlers; suspend: boolean }) {
      useDrillKeys(true, answering, callbacks);
      if (suspend) {
        suspended();
        throw neverResolves;
      }
      return null;
    }
    const tree = (answering: boolean, callbacks: DrillKeyHandlers, suspend: boolean) => (
      <StrictMode><Suspense fallback={null}><Probe answering={answering} callbacks={callbacks} suspend={suspend} /></Suspense></StrictMode>
    );
    const { rerender } = render(tree(false, committed, false));
    act(() => {
      startTransition(() => rerender(tree(true, pending, true)));
    });
    expect(suspended).toHaveBeenCalled();
    press('Enter');
    press('1');
    expect(committed.onPrimary).toHaveBeenCalledTimes(1);
    expect(committed.onRate).not.toHaveBeenCalled();
    expect(pending.onPrimary).not.toHaveBeenCalled();
    expect(pending.onRate).not.toHaveBeenCalled();
    rerender(tree(true, pending, false));
    press('Enter');
    press('1');
    expect(pending.onPrimary).toHaveBeenCalledTimes(1);
    expect(pending.onRate).toHaveBeenCalledExactlyOnceWith('known');
  });

  it('leaves form input keys and their default behavior untouched', () => {
    const callbacks = handlers();
    renderHook(() => useDrillKeys(true, true, callbacks), { wrapper: StrictMode });
    const { getByRole } = render(<input aria-label="Answer" />);
    const input = getByRole('textbox');
    input.focus();
    for (const key of [' ', 'Enter', '1', '2', '3']) {
      expect(fireEvent.keyDown(input, { key })).toBe(true);
    }
    expect(callbacks.onTogglePause).not.toHaveBeenCalled();
    expect(callbacks.onPrimary).not.toHaveBeenCalled();
    expect(callbacks.onRate).not.toHaveBeenCalled();
  });
});
