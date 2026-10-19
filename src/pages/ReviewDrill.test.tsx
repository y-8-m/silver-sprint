// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import type { Question } from '../data/types';
import { createLocalStorageStatsRepository } from '../stats/localStorageStatsRepository';
import { recordRating } from '../stats/statsService';
import { createEmptyStats } from '../stats/statsTypes';
import type { Stats } from '../stats/statsTypes';

const answeredAt = '2026-10-15T00:00:00.000Z';
const firstId = questions[0]!.id;
const thirdId = questions[2]!.id;
const repo = () => createLocalStorageStatsRepository(window.localStorage);

function seedStats(): Stats {
  let stats = recordRating(createEmptyStats(), thirdId, 'unsure', answeredAt);
  stats = recordRating(stats, firstId, 'unknown', answeredAt);
  stats = recordRating(stats, questions[1]!.id, 'known', answeredAt);
  return recordRating(stats, 'deleted', 'unknown', answeredAt);
}

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

function setup(stats = seedStats(), path = '/review', data: Question[] = questions) {
  repo().save(stats);
  return render(<StrictMode><MemoryRouter initialEntries={[path]}><AppRoutes questions={data} glossary={glossary} /></MemoryRouter></StrictMode>);
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

function expectQuestion(id: string, number: number, total: number) {
  expect(screen.getByRole('article').getAttribute('data-question-id')).toBe(id);
  expect(screen.getByRole('status').textContent).toBe(`${number} / ${total} 問`);
}

describe('Review Drill', () => {
  it('only visits current weak IDs in material order and refreshes the snapshot after completion', () => {
    setup();
    expect(screen.getByRole('heading', { name: '復習' })).not.toBeNull();
    expect(screen.getByText('弱点候補 2問を復習します。')).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'コース' })).toBeNull();
    expect(screen.queryByRole('group', { name: '出題順' })).toBeNull();
    click('開始');
    expectQuestion(firstId, 1, 2);
    click('答えを見る');
    click('○ 分かった');
    // The first ID has left weak Stats, but the in-progress sequence is intact.
    expectQuestion(thirdId, 2, 2);
    expect(repo().load().questions[firstId]?.lastRating).toBe('known');
    click('答えを見る');
    click('△ 怪しい');
    expect(screen.getByRole('heading', { name: '復習完了' })).not.toBeNull();
    expect(screen.getByText('2 / 2 問完了')).not.toBeNull();
    click('もう一度');
    expect(screen.getByText('弱点候補 1問を復習します。')).not.toBeNull();
    click('開始');
    expectQuestion(thirdId, 1, 1);
    expect(repo().load().questions[thirdId]).toMatchObject({ unsureCount: 2, lastRating: 'unsure' });
  });

  it.each(['/drill', '/review'])('retries and returns Home from the %s completion screen', (path) => {
    setup(recordRating(createEmptyStats(), firstId, 'unknown', answeredAt), path, [questions[0]!]);
    click('開始');
    click('答えを見る');
    click('評価せずに完了');
    const finished = within(screen.getByRole('heading', { name: path === '/review' ? '復習完了' : 'ドリル完了' }).closest('section')!);
    expect(finished.getByRole('button', { name: 'もう一度' })).not.toBeNull();
    expect(finished.getByRole('link', { name: 'ホームへ' }).getAttribute('href')).toBe('/');
    expect(finished.getAllByRole('link')).toHaveLength(1);
    click('もう一度');
    expect(screen.getByRole('button', { name: '開始' })).not.toBeNull();
    click('開始');
    click('答えを見る');
    click('評価せずに完了');
    fireEvent.click(screen.getByRole('link', { name: 'ホームへ' }));
    expect(screen.getByRole('heading', { name: 'Silver Sprint' })).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    advance(20000);
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('counts only existing weak material in the independent Home Review section', () => {
    setup(seedStats(), '/');
    const review = within(screen.getByRole('region', { name: '復習' }));
    expect(review.getByRole('link', { name: /問題を解き直す/ }).textContent).toContain('2 問');
  });

  it.each(['empty', 'known only', 'orphan only'] as const)('cannot start without weak material: %s', (kind) => {
    let stats = createEmptyStats();
    if (kind === 'known only') stats = recordRating(stats, firstId, 'known', answeredAt);
    if (kind === 'orphan only') stats = recordRating(stats, 'deleted', 'unknown', answeredAt);
    setup(stats);
    expect(screen.getByText('現在、復習対象の問題はありません。')).not.toBeNull();
    expect((screen.getByRole('button', { name: '開始' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('becomes empty when every weak question receives known', () => {
    setup();
    click('開始');
    click('答えを見る');
    click('○ 分かった');
    expectQuestion(thirdId, 2, 2);
    click('答えを見る');
    click('○ 分かった');
    click('もう一度');
    expect(screen.getByText('現在、復習対象の問題はありません。')).not.toBeNull();
    expect((screen.getByRole('button', { name: '開始' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it.each(['manual next', 'answer timeout'] as const)('retains weak stats after %s without rating', (method) => {
    const original = seedStats();
    setup(original);
    click('開始');
    for (let index = 0; index < 2; index++) {
      click('答えを見る');
      if (method === 'manual next') click(index === 0 ? '評価せずに次へ' : '評価せずに完了');
      else advance(10000);
    }
    expect(screen.getByRole('heading', { name: '復習完了' })).not.toBeNull();
    expect(repo().load()).toEqual(original);
    click('もう一度');
    expect(screen.getByText('弱点候補 2問を復習します。')).not.toBeNull();
    click('開始');
    expectQuestion(firstId, 1, 2);
  });

  it.each([
    ['ゆっくり', 30000, 30000], ['標準', 20000, 20000], ['速い', 12000, 14000],
  ] as const)('reuses %s timing and timeWeight on both phases', (tempo, questionMs, answerMs) => {
    const data = [{ ...questions[0]!, timeWeight: 2 }];
    setup(recordRating(createEmptyStats(), firstId, 'unknown', answeredAt), '/review', data);
    fireEvent.click(screen.getByRole('radio', { name: tempo }));
    click('開始');
    expect((screen.getByRole('progressbar') as HTMLProgressElement).max).toBe(questionMs);
    advance(questionMs);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
    expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(answerMs);
    advance(answerMs);
    expect(screen.getByRole('heading', { name: '復習完了' })).not.toBeNull();
    click('もう一度');
    expect((screen.getByRole('radio', { name: tempo }) as HTMLInputElement).checked).toBe(true);
  });

  it('reuses manual pause and releases it when rating advances to the next question', () => {
    setup();
    click('開始');
    click('答えを見る');
    advance(2000);
    click('一時停止');
    advance(20000);
    expectQuestion(firstId, 1, 2);
    expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(8000);
    click('○ 分かった');
    expectQuestion(thirdId, 2, 2);
    expect(screen.queryByRole('button', { name: '再開' })).toBeNull();
    advance(10000);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
  });

  it('uses updated in-memory stats for refresh even if persistence fails', () => {
    setup(recordRating(createEmptyStats(), firstId, 'unknown', answeredAt));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    click('開始');
    click('答えを見る');
    click('○ 分かった');
    expect(screen.getByRole('heading', { name: '復習完了' })).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('戦績を保存できませんでした。');
    click('もう一度');
    expect(screen.getByText('現在、復習対象の問題はありません。')).not.toBeNull();
    expect(repo().load().questions[firstId]?.lastRating).toBe('unknown');
  });

  it('keeps normal Drill as the complete material sequence despite weak stats', () => {
    const original = seedStats();
    setup(original, '/drill');
    expect(screen.getByText(`対象: ${questions.length}問`)).not.toBeNull();
    click('開始');
    for (let index = 0; index < questions.length; index++) {
      expectQuestion(questions[index]!.id, index + 1, questions.length);
      click('答えを見る');
      click(index === questions.length - 1 ? '評価せずに完了' : '評価せずに次へ');
    }
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
    click('もう一度');
    expect(screen.getByText(`対象: ${questions.length}問`)).not.toBeNull();
    expect(repo().load()).toEqual(original);
  });

  it('starts a fresh mode snapshot when navigating between Review and Drill via Home', () => {
    setup();
    click('開始');
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: '終了' }));
    fireEvent.click(screen.getByRole('link', { name: /^すべて/ }));
    expectQuestion(firstId, 1, questions.length);
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: '終了' }));
    fireEvent.click(screen.getByRole('link', { name: /問題を解き直す/ }));
    expect(screen.getByText('弱点候補 2問を復習します。')).not.toBeNull();
    expect(screen.getByRole('link', { name: '← ホーム' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('links from Stats Weak Questions to Review and omits the link when empty', () => {
    setup(seedStats(), '/stats');
    const weak = within(screen.getByRole('region', { name: '弱点問題' }));
    fireEvent.click(weak.getByRole('link', { name: '弱点を復習' }));
    expect(screen.getByText('弱点候補 2問を復習します。')).not.toBeNull();
    cleanup();
    setup(createEmptyStats(), '/stats');
    expect(screen.queryByRole('link', { name: '弱点を復習' })).toBeNull();
    expect(screen.getByText('弱点候補はありません。')).not.toBeNull();
  });

  it('keeps Review in weak material order after a filtered Random Drill', () => {
    setup(seedStats(), '/drill');
    fireEvent.click(screen.getByRole('radio', { name: 'B 実行順・状態遷移' }));
    fireEvent.click(screen.getByRole('radio', { name: 'ランダム' }));
    click('開始');
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: '終了' }));
    fireEvent.click(screen.getByRole('link', { name: /問題を解き直す/ }));
    expect(screen.getByText('弱点候補 2問を復習します。')).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'コース' })).toBeNull();
    expect(screen.queryByRole('group', { name: '出題順' })).toBeNull();
    click('開始');
    expectQuestion(firstId, 1, 2);
    click('答えを見る');
    click('評価せずに次へ');
    expectQuestion(thirdId, 2, 2);
  });

  it('blocks invalid material even with saved weak stats', () => {
    setup(seedStats(), '/review', [...questions, questions[0]!]);
    expect(screen.getByRole('heading', { name: '復習' })).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('教材データにエラー');
    expect(screen.queryByRole('button', { name: '開始' })).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
  });
});
