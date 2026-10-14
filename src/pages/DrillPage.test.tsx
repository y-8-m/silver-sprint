// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import type { Question } from '../data/types';
import { createLocalStorageStatsRepository, STATS_STORAGE_KEY } from '../stats/localStorageStatsRepository';

// Native modal behavior is also checked in the browser.
const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
});
beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  vi.useRealTimers();
});

describe('Drill Rating integration', () => {
  const repository = () => createLocalStorageStatsRepository(window.localStorage);

  it.each([
    ['○ 分かった', 'known'],
    ['△ 怪しい', 'unsure'],
    ['× 分からなかった', 'unknown'],
  ] as const)('records %s then advances to Question 2 with a fresh timer', (label, rating) => {
    setup();
    expect(screen.queryByRole('group', { name: '理解度' })).toBeNull();
    click('開始');
    expect(screen.queryByRole('group', { name: '理解度' })).toBeNull();
    advance(6000);
    expect(screen.getByRole('group', { name: '理解度' })).not.toBeNull();
    click('一時停止');
    click(label);
    expect(screen.getByRole('status').textContent).toBe('Question 2 / 5');
    expect(timer().value).toBe(6000);
    expect(screen.queryByRole('button', { name: '再開' })).toBeNull();
    expect(screen.queryByRole('group', { name: '理解度' })).toBeNull();
    const saved = repository().load().questions[questions[0]!.id];
    expect(saved).toEqual({
      knownCount: rating === 'known' ? 1 : 0,
      unsureCount: rating === 'unsure' ? 1 : 0,
      unknownCount: rating === 'unknown' ? 1 : 0,
      lastRating: rating,
      lastAnsweredAt: new Date().toISOString(),
    });
    expect(Object.keys(repository().load().questions)).toEqual([questions[0]!.id]);
  });

  it('saves a rating on the last answer, finishes, and accumulates after RESET', () => {
    setup([questions[0]!]);
    click('開始');
    click('答えを見る');
    click('○ 分かった');
    expect(screen.getByRole('heading', { name: 'Drill Complete' })).not.toBeNull();
    // jsdom queues a zero-delay storage event when setItem succeeds.
    advance(0);
    expect(vi.getTimerCount()).toBe(0);
    click('もう一度');
    advance(1000);
    click('開始');
    click('答えを見る');
    click('△ 怪しい');
    expect(repository().load().questions[questions[0]!.id]).toMatchObject({
      knownCount: 1, unsureCount: 1, unknownCount: 0, lastRating: 'unsure', lastAnsweredAt: new Date().toISOString(),
    });
  });

  it.each(['manual', 'timer'] as const)('keeps stats unchanged when moving on by %s', (mode) => {
    const repo = repository();
    const previous = { questions: { prior: {
      knownCount: 2, unsureCount: 0, unknownCount: 0, lastRating: 'known' as const, lastAnsweredAt: '2026-10-15T00:00:00.000Z',
    } } };
    repo.save(previous);
    const save = vi.spyOn(Storage.prototype, 'setItem');
    setup(questions.slice(0, 2));
    click('開始');
    click('答えを見る');
    if (mode === 'manual') click('次へ');
    else advance(7000);
    expect(screen.getByRole('status').textContent).toBe('Question 2 / 2');
    expect(repo.load()).toEqual(previous);
    click('答えを見る');
    if (mode === 'manual') click('完了');
    else advance(7000);
    expect(screen.getByRole('heading', { name: 'Drill Complete' })).not.toBeNull();
    expect(repo.load()).toEqual(previous);
    expect(save).not.toHaveBeenCalled();
  });

  it('loads stored stats after unmount and accumulates a new rating', () => {
    const view = setup([questions[0]!]);
    click('開始');
    click('答えを見る');
    click('× 分からなかった');
    view.unmount();
    setup([questions[0]!]);
    click('開始');
    click('答えを見る');
    click('○ 分かった');
    expect(repository().load().questions[questions[0]!.id]).toMatchObject({ knownCount: 1, unknownCount: 1, lastRating: 'known' });
  });

  it('continues Drill and keeps memory counts if storage fails, including on the final rating', () => {
    const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    setup([questions[0]!]);
    click('開始');
    click('答えを見る');
    click('○ 分かった');
    expect(screen.getByRole('heading', { name: 'Drill Complete' })).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('戦績を保存できませんでした。');
    click('もう一度');
    save.mockRestore();
    click('開始');
    click('答えを見る');
    click('△ 怪しい');
    expect(repository().load().questions[questions[0]!.id]).toMatchObject({ knownCount: 1, unsureCount: 1 });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('recovers from corrupted storage and saves a fresh record', () => {
    window.localStorage.setItem(STATS_STORAGE_KEY, '{ broken json');
    setup([questions[0]!]);
    click('開始');
    click('答えを見る');
    click('○ 分かった');
    expect(repository().load().questions[questions[0]!.id]?.knownCount).toBe(1);
  });
});
afterAll(() => {
  for (const [name, descriptor] of [['showModal', originalShow], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

function setup(data: Question[] = questions) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/drill']}>
        <AppRoutes questions={data} glossary={glossary} />
      </MemoryRouter>
    </StrictMode>,
  );
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

function timer() {
  return screen.getByRole('progressbar', { name: '残り時間' }) as HTMLProgressElement;
}

describe('Drill Timer integration', () => {
  it('automatically reveals, advances, finishes and resets without active timers', () => {
    setup();
    expect((screen.getByRole('radio', { name: 'Normal' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByRole('progressbar')).toBeNull();
    click('開始');
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByText('Time: 6.0s')).not.toBeNull();
    advance(6000);
    expect(screen.getByRole('heading', { name: 'Answer' })).not.toBeNull();
    expect(screen.getByText('Time: 7.0s')).not.toBeNull();
    advance(7000);
    expect(screen.queryByRole('heading', { name: 'Answer' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Question 2 / 5');
    for (let number = 2; number <= 5; number++) {
      advance(timer().max);
      expect(screen.getByRole('heading', { name: 'Answer' })).not.toBeNull();
      advance(timer().max);
    }
    expect(screen.getByRole('heading', { name: 'Drill Complete' })).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    click('もう一度');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect((screen.getByRole('radio', { name: 'Normal' }) as HTMLInputElement).checked).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([['Slow', 10000, 10000], ['Fast', 3000, 4000]] as const)('uses selected %s tempo and retains it on reset', (tempo, questionMs, answerMs) => {
    setup([questions[0]!]);
    fireEvent.click(screen.getByRole('radio', { name: tempo }));
    click('開始');
    expect(timer().max).toBe(questionMs);
    advance(questionMs);
    expect(timer().max).toBe(answerMs);
    advance(answerMs);
    click('もう一度');
    expect((screen.getByRole('radio', { name: tempo }) as HTMLInputElement).checked).toBe(true);
  });

  it('applies timeWeight to both phases', () => {
    setup([{ ...questions[0]!, timeWeight: 2 }]);
    click('開始');
    expect(timer().max).toBe(12000);
    advance(5900);
    expect(screen.queryByRole('heading', { name: 'Answer' })).toBeNull();
    advance(6100);
    expect(screen.getByRole('heading', { name: 'Answer' })).not.toBeNull();
    expect(timer().value).toBe(14000);
    advance(13900);
    expect(screen.queryByRole('heading', { name: 'Drill Complete' })).toBeNull();
    advance(100);
    expect(screen.getByRole('heading', { name: 'Drill Complete' })).not.toBeNull();
  });

  it('pauses manually and resumes from the remaining time', () => {
    setup();
    click('開始');
    advance(2100);
    click('一時停止');
    expect(timer().value).toBe(3900);
    advance(20000);
    expect(timer().value).toBe(3900);
    expect(screen.queryByRole('heading', { name: 'Answer' })).toBeNull();
    click('再開');
    advance(3800);
    expect(screen.queryByRole('heading', { name: 'Answer' })).toBeNull();
    advance(100);
    expect(screen.getByRole('heading', { name: 'Answer' })).not.toBeNull();
  });

  it('manual reveal and next reset the timer and release manual pause', () => {
    setup();
    click('開始');
    advance(2000);
    click('一時停止');
    click('答えを見る');
    expect(timer().value).toBe(7000);
    expect(screen.queryByRole('button', { name: '再開' })).toBeNull();
    advance(1000);
    expect(timer().value).toBe(6000);
    click('一時停止');
    click('次へ');
    expect(timer().value).toBe(6000);
    expect(screen.queryByRole('button', { name: '再開' })).toBeNull();
    advance(6000);
    expect(screen.getByRole('heading', { name: 'Answer' })).not.toBeNull();
  });

  it('holds the timer while glossary detail is open and resumes without resetting', () => {
    setup();
    click('開始');
    click('答えを見る');
    advance(2800);
    fireEvent.click(within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' }));
    const dialog = screen.getByRole('dialog', { name: 'ローカル変数' });
    expect(timer().value).toBe(4200);
    advance(20000);
    expect(timer().value).toBe(4200);
    expect(screen.getByRole('status').textContent).toBe('Question 1 / 5');
    fireEvent.click(within(dialog).getByRole('button', { name: '閉じる' }));
    expect(timer().value).toBe(4200);
    advance(4100);
    expect(screen.getByRole('status').textContent).toBe('Question 1 / 5');
    advance(100);
    expect(screen.getByRole('status').textContent).toBe('Question 2 / 5');
  });

  it('keeps manual pause after closing glossary detail', () => {
    setup();
    click('開始');
    click('答えを見る');
    advance(1000);
    click('一時停止');
    fireEvent.click(within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '閉じる' }));
    advance(20000);
    expect(timer().value).toBe(6000);
    click('再開');
    advance(6000);
    expect(screen.getByRole('status').textContent).toBe('Question 2 / 5');
  });

  it('does not pause or extend time on short tooltip hover or focus', () => {
    setup();
    click('開始');
    click('答えを見る');
    const trigger = within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).not.toBeNull();
    advance(7000);
    expect(screen.getByRole('status').textContent).toBe('Question 2 / 5');
  });

  it('cleans up the timer when navigating away', () => {
    setup();
    click('開始');
    advance(2000);
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Home' }));
    expect(vi.getTimerCount()).toBe(0);
    advance(20000);
    expect(screen.queryByRole('progressbar')).toBeNull();
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Drill' }));
    expect(screen.getByRole('button', { name: '開始' })).not.toBeNull();
  });
});
