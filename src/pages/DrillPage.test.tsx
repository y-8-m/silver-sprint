// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { questions as materialQuestions } from '../data/questions';
import type { Question } from '../data/types';
import { DRILL_PREFERENCES_STORAGE_KEY } from '../drill/drillLaunch';
import * as sessionSequence from '../drill/sessionSequence';
import { createLocalStorageStatsRepository, STATS_BACKUP_STORAGE_KEY, STATS_STORAGE_KEY } from '../stats/localStorageStatsRepository';

// Keep UI sessions small; full material coverage belongs to sequence tests.
const questions = materialQuestions.slice(0, 8);

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
    advance(10000);
    expect(screen.getByRole('group', { name: '理解度' })).not.toBeNull();
    click('一時停止');
    click(label);
    expect(screen.getByRole('status').textContent).toBe(`2 / ${questions.length} 問`);
    expect(timer().value).toBe(10000);
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
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
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
    if (mode === 'manual') click('評価せずに次へ');
    else advance(10000);
    expect(screen.getByRole('status').textContent).toBe('2 / 2 問');
    expect(repo.load()).toEqual(previous);
    click('答えを見る');
    if (mode === 'manual') click('評価せずに完了');
    else advance(10000);
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
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
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
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
    expect(window.localStorage.getItem(STATS_BACKUP_STORAGE_KEY)).toBe('{ broken json');
  });

  it('moves focus to the new question heading after rating and after automatic advance', () => {
    setup();
    click('開始');
    click('答えを見る');
    screen.getByRole('button', { name: '○ 分かった' }).focus();
    click('○ 分かった');
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }));
    advance(10000);
    advance(10000);
    expect(screen.getByRole('status').textContent).toBe(`3 / ${questions.length} 問`);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }));
  });
});
afterAll(() => {
  for (const [name, descriptor] of [['showModal', originalShow], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

function setup(data: Question[] = questions, path = '/drill') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
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

describe('Drill bottom controller', () => {
  it.each(['/drill', '/review'])('keeps %s controls together and ratings unavailable until the answer', (path) => {
    const repository = createLocalStorageStatsRepository(window.localStorage);
    repository.save({ questions: Object.fromEntries(questions.slice(0, 2).map((question) => [question.id, {
      knownCount: 0, unsureCount: 0, unknownCount: 1,
      lastRating: 'unknown', lastAnsweredAt: '2026-10-15T00:00:00Z',
    }])) });
    setup(questions.slice(0, 2), path);
    expect(screen.queryByRole('region', { name: 'ドリル操作' })).toBeNull();
    click('開始');
    const controllerElement = screen.getByRole('region', { name: 'ドリル操作' });
    const controller = within(controllerElement);
    const header = within(screen.getByRole('button', { name: '終了' }).parentElement!);
    expect(header.getAllByRole('button')).toHaveLength(2);
    expect(header.getByRole('button', { name: '使い方' })).not.toBeNull();
    expect(header.queryByRole('status')).toBeNull();
    expect(controller.getByRole('status').textContent).toBe('1 / 2 問');
    expect(controller.getByText('問題表示中')).not.toBeNull();
    expect(controller.getByText('Silver Sprint').tagName).toBe('P');
    expect(controller.getAllByRole('button')).toHaveLength(2);
    expect(controller.queryByRole('group', { name: '理解度' })).toBeNull();
    const reservedRatings = controllerElement.querySelector('fieldset')!;
    const hiddenButtons = [...reservedRatings.querySelectorAll('button')];
    expect(hiddenButtons).toHaveLength(3);
    const pause = controller.getByRole('button', { name: '一時停止' });
    pause.focus();
    const previousStats = repository.load();
    for (const button of hiddenButtons) {
      expect(button.disabled).toBe(true);
      button.focus();
      expect(document.activeElement).toBe(pause);
      fireEvent.click(button);
    }
    expect(repository.load()).toEqual(previousStats);
    advance(2100);
    expect(controller.getByText('08').parentElement?.textContent).toBe('残り08秒');
    click('一時停止');
    expect(controller.getByRole('button', { name: '再開' })).not.toBeNull();
    advance(20000);
    expect(timer().value).toBe(7900);
    click('答えを見る');
    expect(controller.getByText('解説表示中')).not.toBeNull();
    expect(controller.getByRole('group', { name: '理解度' })).toBe(reservedRatings);
    expect(controller.getAllByRole('button')).toHaveLength(5);
    expect(hiddenButtons.every((button) => !button.disabled)).toBe(true);
    click('△ 怪しい');
    expect(controller.getByRole('status').textContent).toBe('2 / 2 問');
    expect(repository.load().questions[questions[0]!.id]?.lastRating).toBe('unsure');
    expect(controller.queryByRole('group', { name: '理解度' })).toBeNull();
    click('答えを見る');
    click('評価せずに完了');
    expect(screen.queryByRole('region', { name: 'ドリル操作' })).toBeNull();
    expect(screen.getByRole('heading', { name: path === '/review' ? '復習完了' : 'ドリル完了' })).not.toBeNull();
  });
});

describe('Drill Course / Order integration', () => {
  function select(name: string) {
    fireEvent.click(screen.getByRole('radio', { name }));
  }

  function expectQuestion(id: string) {
    expect(screen.getByRole('article').getAttribute('data-question-id')).toBe(id);
    expect(screen.queryByRole('group', { name: 'コース' })).toBeNull();
    expect(screen.queryByRole('group', { name: '出題順' })).toBeNull();
  }

  it('defaults to Mixed / Sequential / Normal and visits all questions in material order', () => {
    setup();
    for (const name of ['全カテゴリ', '順番', '標準']) {
      expect((screen.getByRole('radio', { name }) as HTMLInputElement).checked).toBe(true);
    }
    expect(screen.getByRole('status').textContent).toBe(`対象: ${questions.length}問`);
    click('開始');
    for (const question of questions) {
      expectQuestion(question.id);
      click('答えを見る');
      click('○ 分かった');
    }
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it.each([
    ['A 概念理解', 'A'], ['B 実行順・状態遷移', 'B'], ['C Java固有ルール', 'C'], ['D API・語彙', 'D'],
  ] as const)('updates the count and visits only %s, regardless of saved ratings', (label, category) => {
    const repo = createLocalStorageStatsRepository(window.localStorage);
    const matching = questions.filter((question) => question.category === category);
    repo.save({ questions: Object.fromEntries(matching.map((question, index) => [question.id, {
      knownCount: index === 0 ? 1 : 0, unsureCount: index === 0 ? 0 : 1, unknownCount: 0,
      lastRating: index === 0 ? 'known' : 'unsure', lastAnsweredAt: '2026-10-15T00:00:00.000Z',
    }])) });
    setup();
    select(label);
    expect(screen.getByRole('status').textContent).toBe(`対象: ${matching.length}問`);
    click('開始');
    for (const question of matching) {
      expectQuestion(question.id);
      click('答えを見る');
      click('× 分からなかった');
    }
    expect(screen.getByText(`${matching.length} / ${matching.length} 問完了`)).not.toBeNull();
    click('もう一度');
    expect((screen.getByRole('radio', { name: label }) as HTMLInputElement).checked).toBe(true);
    click('開始');
    expectQuestion(matching[0]!.id);
  });

  it('disables an empty Course D and recovers when Mixed is selected', () => {
    const data = questions.filter((question) => question.category !== 'D');
    setup(data);
    select('D API・語彙');
    expect(screen.getByRole('status').textContent).toBe('対象: 0問');
    expect((screen.getByRole('button', { name: '開始' }) as HTMLButtonElement).disabled).toBe(true);
    click('開始');
    expect(screen.queryByRole('article')).toBeNull();
    select('全カテゴリ');
    expect(screen.getByRole('status').textContent).toBe(`対象: ${data.length}問`);
    click('開始');
    expectQuestion(questions[0]!.id);
  });

  it('starts only the latest READY sequence after C → B and Random → Sequential', () => {
    setup();
    select('C Java固有ルール');
    select('ランダム');
    select('B 実行順・状態遷移');
    select('順番');
    expect(screen.getByRole('status').textContent).toBe(`対象: ${questions.filter((question) => question.category === 'B').length}問`);
    click('開始');
    for (const question of questions.filter((question) => question.category === 'B')) {
      expectQuestion(question.id);
      click('答えを見る');
      click('○ 分かった');
    }
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
  });

  it('freezes the builder sequence through tempo, glossary, rating, Stats, and timer changes; rebuilds on RESET', () => {
    const data = questions.slice(0, 3);
    const actualBuild = sessionSequence.buildQuestionSequence;
    const build = vi.spyOn(sessionSequence, 'buildQuestionSequence')
      .mockImplementation((data, settings) => actualBuild(data, settings, () => 0));
    setup(data);
    select('C Java固有ルール');
    select('ランダム');
    const snapshot = [...build.mock.results.at(-1)!.value as string[]];
    expect(snapshot).toEqual([questions[2]!.id, questions[0]!.id]);
    const calls = build.mock.calls.length;
    select('ゆっくり');
    click('開始');
    expectQuestion(snapshot[0]!);
    click('答えを見る');
    click('○ 分かった');
    expectQuestion(snapshot[1]!);
    advance(15000);
    fireEvent.click(within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' }));
    advance(20000);
    expectQuestion(snapshot[1]!);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '閉じる' }));
    advance(15000);
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
    expect(build).toHaveBeenCalledTimes(calls);
    click('もう一度');
    expect(build).toHaveBeenCalledTimes(calls + 1);
    expect(build).toHaveBeenLastCalledWith(data, { course: 'C', order: 'random', questionCount: 'all' });
    for (const name of ['C Java固有ルール', 'ランダム', 'ゆっくり']) {
      expect((screen.getByRole('radio', { name }) as HTMLInputElement).checked).toBe(true);
    }
    const nextSnapshot = build.mock.results.at(-1)!.value as string[];
    expect(nextSnapshot).not.toBe(build.mock.results.at(-2)!.value);
    click('開始');
    for (const id of nextSnapshot) {
      expectQuestion(id);
      click('答えを見る');
      click('○ 分かった');
    }
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
    expect(build).toHaveBeenCalledTimes(calls + 1);
  });
});

describe('Drill question count integration', () => {
  it('keeps direct-access defaults independent of saved Home preferences', () => {
    window.localStorage.setItem(DRILL_PREFERENCES_STORAGE_KEY, JSON.stringify({ order: 'random', tempo: 'fast', questionCount: 5 }));
    setup();
    for (const name of ['全カテゴリ', '順番', '標準', '全問']) {
      expect((screen.getByRole('radio', { name }) as HTMLInputElement).checked).toBe(true);
    }
    expect(screen.getByRole('status').textContent).toBe(`対象: ${questions.length}問`);
  });

  it.each([['5問', 5], ['10問', 8], ['15問', 8], ['全問', 8]] as const)('updates the ready count immediately for %s', (name, total) => {
    setup();
    fireEvent.click(screen.getByRole('radio', { name }));
    expect(screen.getByRole('status').textContent).toBe(`対象: ${total}問`);
    click('開始');
    expect(screen.getByRole('status').textContent).toBe(`1 / ${total} 問`);
    expect(screen.queryByRole('group', { name: '出題数' })).toBeNull();
  });

  it.each(['5', '10', '15', 'all', 'invalid', ''])('applies URL count %s to the actual session', (count) => {
    const data = Array.from({ length: 16 }, (_, index) => ({ ...questions[0]!, id: `sample-${index}` }));
    setup(data, `/drill?course=mixed&order=random&tempo=fast${count ? `&count=${count}` : ''}`);
    const total = ['5', '10', '15'].includes(count) ? Number(count) : data.length;
    expect(screen.getByRole('status').textContent).toBe(`1 / ${total} 問`);
    expect(screen.queryByRole('button', { name: '開始' })).toBeNull();
  });

  it('keeps a limited session fixed through interaction and samples again with the same settings on retry', () => {
    const actualBuild = sessionSequence.buildQuestionSequence;
    let randomValue = 0.999;
    const build = vi.spyOn(sessionSequence, 'buildQuestionSequence')
      .mockImplementation((data, settings) => actualBuild(data, settings, () => randomValue));
    setup();
    fireEvent.click(screen.getByRole('radio', { name: '5問' }));
    const snapshot = [...build.mock.results.at(-1)!.value as string[]];
    const calls = build.mock.calls.length;
    fireEvent.click(screen.getByRole('radio', { name: 'ゆっくり' }));
    click('開始');
    click('一時停止');
    advance(20000);
    click('再開');
    click('答えを見る');
    fireEvent.click(within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' }));
    advance(20000);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '閉じる' }));
    for (const [index, id] of snapshot.entries()) {
      expect(screen.getByRole('article').getAttribute('data-question-id')).toBe(id);
      expect(screen.getByRole('status').textContent).toBe(`${index + 1} / 5 問`);
      if (index > 0) click('答えを見る');
      click('○ 分かった');
    }
    expect(screen.getByText('5 / 5 問完了')).not.toBeNull();
    expect(build).toHaveBeenCalledTimes(calls);
    randomValue = 0;
    click('もう一度');
    expect(build).toHaveBeenCalledTimes(calls + 1);
    expect(build).toHaveBeenLastCalledWith(questions, { course: 'mixed', order: 'sequential', questionCount: 5 });
    for (const name of ['全カテゴリ', '順番', 'ゆっくり', '5問']) {
      expect((screen.getByRole('radio', { name }) as HTMLInputElement).checked).toBe(true);
    }
    const nextSnapshot = build.mock.results.at(-1)!.value as string[];
    expect(nextSnapshot).not.toEqual(snapshot);
    expect(nextSnapshot).toHaveLength(5);
    click('開始');
    expect(screen.getByRole('article').getAttribute('data-question-id')).toBe(nextSnapshot[0]);
    expect(build).toHaveBeenCalledTimes(calls + 1);
  });

  it('keeps an empty limited course unstartable', () => {
    setup(questions.filter((question) => question.category !== 'D'));
    fireEvent.click(screen.getByRole('radio', { name: '5問' }));
    fireEvent.click(screen.getByRole('radio', { name: 'D API・語彙' }));
    expect(screen.getByRole('status').textContent).toBe('対象: 0問');
    expect((screen.getByRole('button', { name: '開始' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Drill Timer integration', () => {
  it('automatically reveals, advances, finishes and resets without active timers', () => {
    setup();
    expect((screen.getByRole('radio', { name: '標準' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByRole('progressbar')).toBeNull();
    click('開始');
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByText('10', { selector: 'span' })).not.toBeNull();
    advance(10000);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
    expect(screen.getByText('10', { selector: 'span' })).not.toBeNull();
    advance(10000);
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(`2 / ${questions.length} 問`);
    for (let number = 2; number <= questions.length; number++) {
      advance(timer().max);
      expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
      advance(timer().max);
    }
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    click('もう一度');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect((screen.getByRole('radio', { name: '標準' }) as HTMLInputElement).checked).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([['ゆっくり', 15000, 15000], ['速い', 6000, 7000]] as const)('uses selected %s tempo and retains it on reset', (tempo, questionMs, answerMs) => {
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
    expect(timer().max).toBe(20000);
    advance(5900);
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    advance(14100);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
    expect(timer().value).toBe(20000);
    advance(19900);
    expect(screen.queryByRole('heading', { name: 'ドリル完了' })).toBeNull();
    advance(100);
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
  });

  it('pauses manually and resumes from the remaining time', () => {
    setup();
    click('開始');
    advance(2100);
    click('一時停止');
    expect(timer().value).toBe(7900);
    advance(20000);
    expect(timer().value).toBe(7900);
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    click('再開');
    advance(7800);
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    advance(100);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
  });

  it('manual reveal and next reset the timer and release manual pause', () => {
    setup();
    click('開始');
    advance(2000);
    click('一時停止');
    click('答えを見る');
    expect(timer().value).toBe(10000);
    expect(screen.queryByRole('button', { name: '再開' })).toBeNull();
    advance(1000);
    expect(timer().value).toBe(9000);
    click('一時停止');
    click('評価せずに次へ');
    expect(timer().value).toBe(10000);
    expect(screen.queryByRole('button', { name: '再開' })).toBeNull();
    advance(10000);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
  });

  it('holds the timer while glossary detail is open and resumes without resetting', () => {
    setup();
    click('開始');
    click('答えを見る');
    advance(2800);
    fireEvent.click(within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' }));
    const dialog = screen.getByRole('dialog', { name: 'ローカル変数' });
    expect(timer().value).toBe(7200);
    advance(20000);
    expect(timer().value).toBe(7200);
    expect(screen.getByRole('status').textContent).toBe(`1 / ${questions.length} 問`);
    fireEvent.click(within(dialog).getByRole('button', { name: '閉じる' }));
    expect(timer().value).toBe(7200);
    advance(7100);
    expect(screen.getByRole('status').textContent).toBe(`1 / ${questions.length} 問`);
    advance(100);
    expect(screen.getByRole('status').textContent).toBe(`2 / ${questions.length} 問`);
  });

  it.each([
    ['/drill', 'question'], ['/drill', 'answer'],
    ['/review', 'question'], ['/review', 'answer'],
  ] as const)('pauses %s %s for Help and resumes the exact remaining time', (path, phase) => {
    const repository = createLocalStorageStatsRepository(window.localStorage);
    repository.save({ questions: { [questions[0]!.id]: {
      knownCount: 0, unsureCount: 1, unknownCount: 0,
      lastRating: 'unsure', lastAnsweredAt: '2026-10-15T00:00:00Z',
    } } });
    const previousStats = repository.load();
    setup(questions.slice(0, 2), path);
    click('開始');
    if (phase === 'answer') click('答えを見る');
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('button', { name: '終了' })).not.toBeNull();
    const questionId = screen.getByRole('article').getAttribute('data-question-id');
    const progress = screen.getByRole('status').textContent;
    advance(2137);
    click('使い方');
    const dialog = screen.getByRole('dialog', { name: '使い方' });
    expect(screen.queryByRole('dialog', { name: 'ローカル変数' })).toBeNull();
    expect(timer().value).toBe(7863);
    advance(20000);
    expect(timer().value).toBe(7863);
    expect(screen.getByRole('article').getAttribute('data-question-id')).toBe(questionId);
    expect(screen.getByRole('status').textContent).toBe(progress);
    fireEvent.click(within(dialog).getByRole('button', { name: '閉じる' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(timer().value).toBe(7863);
    expect(screen.getByRole('status').textContent).toBe(progress);
    advance(7862);
    expect(screen.getByRole('status').textContent).toBe(progress);
    expect(screen.queryByRole('heading', { name: '答え' }) !== null).toBe(phase === 'answer');
    advance(1);
    if (phase === 'question') expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
    else if (path === '/review') expect(screen.getByRole('heading', { name: '復習完了' })).not.toBeNull();
    else expect(screen.getByRole('status').textContent).toBe('2 / 2 問');
    expect(repository.load()).toEqual(previousStats);
  });

  it('keeps a manual pause after closing Help', () => {
    setup();
    click('開始');
    advance(2100);
    click('一時停止');
    click('使い方');
    fireEvent(screen.getByRole('dialog', { name: '使い方' }), new Event('cancel', { cancelable: true }));
    advance(20000);
    expect(timer().value).toBe(7900);
    expect(screen.getByRole('button', { name: '再開' })).not.toBeNull();
    click('再開');
    advance(7900);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
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
    expect(timer().value).toBe(9000);
    click('再開');
    advance(9000);
    expect(screen.getByRole('status').textContent).toBe(`2 / ${questions.length} 問`);
  });

  it('does not pause or extend time on short tooltip hover or focus', () => {
    setup();
    click('開始');
    click('答えを見る');
    const trigger = within(screen.getByRole('article')).getByRole('button', { name: 'ローカル変数' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).not.toBeNull();
    advance(10000);
    expect(screen.getByRole('status').textContent).toBe(`2 / ${questions.length} 問`);
  });

  it('cleans up the timer when navigating away', () => {
    setup();
    click('開始');
    advance(2000);
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: '終了' }));
    expect(screen.getByRole('heading', { name: 'Silver Sprint' })).not.toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    advance(20000);
    expect(screen.queryByRole('progressbar')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: /^全カテゴリ/ }));
    expect(screen.getByRole('status').textContent).toBe(`1 / ${questions.length} 問`);
  });
});
