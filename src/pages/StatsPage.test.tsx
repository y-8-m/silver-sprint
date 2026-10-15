// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import type { Question } from '../data/types';
import { createLocalStorageStatsRepository, STATS_BACKUP_STORAGE_KEY, STATS_STORAGE_KEY } from '../stats/localStorageStatsRepository';
import type { Stats } from '../stats/statsTypes';

const seed: Stats = { questions: {
  [questions[0]!.id]: { knownCount: 0, unsureCount: 0, unknownCount: 2, lastRating: 'unknown', lastAnsweredAt: '2026-10-15T01:00:00Z' },
  [questions[1]!.id]: { knownCount: 0, unsureCount: 1, unknownCount: 0, lastRating: 'unsure', lastAnsweredAt: '2026-10-15T02:00:00Z' },
  [questions[2]!.id]: { knownCount: 3, unsureCount: 0, unknownCount: 0, lastRating: 'known', lastAnsweredAt: '2026-10-15T03:00:00Z' },
  deleted: { knownCount: 50, unsureCount: 50, unknownCount: 50, lastRating: 'unknown', lastAnsweredAt: '2026-10-15T04:00:00Z' },
} };

const repository = () => createLocalStorageStatsRepository(window.localStorage);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-15T05:00:00Z'));
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  vi.useRealTimers();
});

function setup(path = '/stats', data: Question[] = questions) {
  return render(<StrictMode><MemoryRouter initialEntries={[path]}><AppRoutes questions={data} glossary={glossary} /></MemoryRouter></StrictMode>);
}

function metric(label: string, expected: string) {
  const summary = within(screen.getByRole('region', { name: '概要' }));
  expect(summary.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent).toBe(expected);
}

describe('Stats Page', () => {
  it('renders material-based summary and the complete table including unrated questions', () => {
    repository().save(seed);
    setup();
    metric('評価済み問題', `3 / ${questions.length}`);
    metric('未評価問題', String(questions.length - 3));
    metric('評価回数', '6');
    metric('○ 分かった', '3');
    metric('△ 怪しい', '1');
    metric('× 分からなかった', '2');
    const table = within(screen.getByRole('table', { name: '問題別戦績（教材順）' }));
    const rows = table.getAllByRole('row');
    expect(rows).toHaveLength(questions.length + 1);
    for (let index = 0; index < questions.length; index++) {
      const row = within(rows[index + 1]!);
      expect(row.getByRole('rowheader').textContent).toBe(questions[index]!.topic);
    }
    expect(table.getAllByText('評価なし')).toHaveLength(questions.length - 3);
    expect(within(rows[1]!).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['C', '0', '0', '2', '× 分からなかった', '2026/10/15 10:00:00']);
    expect(table.getByText('2026/10/15 10:00:00').getAttribute('datetime')).toBe('2026-10-15T01:00:00Z');
    expect(screen.getByRole('navigation').textContent).toBe('ホーム問題一覧用語集ドリル復習戦績');
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: '戦績' }).getAttribute('aria-current')).toBe('page');
  });

  it('shows weak questions in material order and recent evaluations newest first', () => {
    repository().save(seed);
    setup();
    const weak = within(screen.getByRole('region', { name: '弱点問題' })).getAllByRole('listitem');
    expect(weak.map((item) => item.textContent)).toEqual([
      `[C] ${questions[0]!.topic}最後の評価: × 分からなかった`,
      `[B] ${questions[1]!.topic}最後の評価: △ 怪しい`,
    ]);
    const recent = within(screen.getByRole('region', { name: '最近の評価' })).getAllByRole('listitem');
    expect(recent).toHaveLength(3);
    expect(recent[0]?.textContent).toContain(questions[2]!.topic);
    expect(recent[1]?.textContent).toContain(questions[1]!.topic);
    expect(recent[2]?.textContent).toContain(questions[0]!.topic);
    expect(screen.queryByText(/deleted/)).toBeNull();
  });

  it('shows empty states while still listing every question', () => {
    setup();
    metric('評価済み問題', `0 / ${questions.length}`);
    metric('未評価問題', String(questions.length));
    metric('評価回数', '0');
    expect(screen.getByText('まだ評価記録がありません。')).not.toBeNull();
    expect(screen.getByText('弱点候補はありません。')).not.toBeNull();
    expect(screen.getByText('最近の評価はありません。')).not.toBeNull();
    expect(screen.getAllByText('評価なし')).toHaveLength(questions.length);
  });

  it('clears immediately on confirmation and remains empty after remount', () => {
    repository().save(seed);
    window.localStorage.setItem(STATS_BACKUP_STORAGE_KEY, '{ original backup');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const view = setup();
    fireEvent.click(screen.getByRole('button', { name: '戦績をクリア' }));
    expect(confirm).toHaveBeenCalledWith('戦績をすべて削除しますか？');
    metric('評価済み問題', `0 / ${questions.length}`);
    metric('評価回数', '0');
    expect(screen.getByText('弱点候補はありません。')).not.toBeNull();
    expect(screen.getByText('最近の評価はありません。')).not.toBeNull();
    expect(window.localStorage.getItem(STATS_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(STATS_BACKUP_STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    view.unmount();
    setup();
    metric('評価済み問題', `0 / ${questions.length}`);
  });

  it('leaves memory and storage unchanged when confirmation is cancelled', () => {
    repository().save(seed);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    setup();
    fireEvent.click(screen.getByRole('button', { name: '戦績をクリア' }));
    metric('評価済み問題', `3 / ${questions.length}`);
    expect(repository().load()).toEqual(seed);
    expect(remove).not.toHaveBeenCalled();
  });

  it('reports clear failure without crashing and explains that reload may restore records', () => {
    repository().save(seed);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    setup();
    fireEvent.click(screen.getByRole('button', { name: '戦績をクリア' }));
    metric('評価済み問題', `0 / ${questions.length}`);
    expect(screen.getByRole('alert').textContent).toContain('一部の保存データを削除できなかった可能性があります。');
    expect(screen.getByRole('alert').textContent).toContain('再読み込み');
    expect(repository().load()).toEqual(seed);
  });

  it('reports a remaining backup even when primary stats are successfully cleared', () => {
    repository().save(seed);
    window.localStorage.setItem(STATS_BACKUP_STORAGE_KEY, '{ original backup');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const removeItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key: string) {
      if (key === STATS_BACKUP_STORAGE_KEY) throw new DOMException('Blocked', 'SecurityError');
      removeItem.call(this, key);
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: '戦績をクリア' }));
    metric('評価済み問題', `0 / ${questions.length}`);
    expect(screen.getByRole('alert').textContent).toContain('一部の保存データを削除できなかった可能性があります。');
    expect(window.localStorage.getItem(STATS_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(STATS_BACKUP_STORAGE_KEY)).toBe('{ original backup');
  });

  it('shows Drill ratings immediately after navigating to Stats in the same session', () => {
    setup('/drill');
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    act(() => vi.advanceTimersByTime(6000));
    fireEvent.click(screen.getByRole('button', { name: '△ 怪しい' }));
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: '戦績' }));
    metric('評価済み問題', `1 / ${questions.length}`);
    metric('△ 怪しい', '1');
    expect(within(screen.getByRole('region', { name: '弱点問題' })).getByText(`[C] ${questions[0]!.topic}`)).not.toBeNull();
    expect(within(screen.getByRole('region', { name: '最近の評価' })).getByText(/[C].*ローカル変数の初期化/)).not.toBeNull();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: '戦績をクリア' }));
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'ドリル' }));
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    fireEvent.click(screen.getByRole('button', { name: '答えを見る' }));
    fireEvent.click(screen.getByRole('button', { name: '○ 分かった' }));
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: '戦績' }));
    metric('○ 分かった', '1');
    metric('△ 怪しい', '0');
    expect(screen.getByText('弱点候補はありません。')).not.toBeNull();
  });

  it('blocks invalid material and links to existing Home diagnostics', () => {
    repository().save(seed);
    setup('/stats', [...questions, questions[0]!]);
    expect(screen.getByRole('alert').textContent).toContain('教材データにエラー');
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button', { name: '戦績をクリア' })).toBeNull();
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'ホーム' }));
    expect(screen.getByText('教材データ: エラー')).not.toBeNull();
  });

  it('handles corrupt storage with the empty state', () => {
    window.localStorage.setItem(STATS_STORAGE_KEY, '{ broken');
    setup();
    metric('評価済み問題', `0 / ${questions.length}`);
    expect(screen.getByText('まだ評価記録がありません。')).not.toBeNull();
  });
});
