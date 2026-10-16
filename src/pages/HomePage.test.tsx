// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import { DRILL_PREFERENCES_STORAGE_KEY } from '../drill/drillLaunch';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function setup(path = '/') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes questions={questions} glossary={glossary} />
    </MemoryRouter>,
  );
  return user;
}

describe('Home', () => {
  it('lists the courses directly under the Drill heading with question counts', () => {
    setup();
    const drill = within(screen.getByRole('region', { name: 'ドリル' }));
    const rows = drill.getAllByRole('link');
    expect(rows.map((row) => row.textContent)).toEqual([
      `すべて${questions.length} 問`,
      ...(['A', 'B', 'C', 'D'] as const).map((category) => (
        `${category}${{ A: '概念理解', B: '実行順・状態遷移', C: 'Java固有ルール', D: 'API・語彙' }[category]}${questions.filter((question) => question.category === category).length} 問`
      )),
    ]);
  });

  it('keeps the order and tempo settings closed until the toggle is pressed', async () => {
    const user = setup();
    const toggle = screen.getByRole('button', { name: /出題設定/ });
    expect(toggle.textContent).toContain('順番 · 標準');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('radio', { name: 'ランダム' })).toBeNull();
    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await user.click(screen.getByRole('radio', { name: 'ランダム' }));
    await user.click(screen.getByRole('radio', { name: '速い' }));
    expect(toggle.textContent).toContain('ランダム · 速い');
    expect(JSON.parse(window.localStorage.getItem(DRILL_PREFERENCES_STORAGE_KEY)!)).toEqual({ order: 'random', tempo: 'fast' });
  });

  it('starts the Drill immediately from a course row with the saved settings', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /出題設定/ }));
    await user.click(screen.getByRole('radio', { name: 'ゆっくり' }));
    await user.click(screen.getByRole('link', { name: /実行順・状態遷移/ }));
    const bCount = questions.filter((question) => question.category === 'B').length;
    expect(screen.getByRole('status').textContent).toBe(`1 / ${bCount} 問`);
    expect(screen.queryByRole('button', { name: '開始' })).toBeNull();
    expect(screen.getByRole('article').textContent).toContain('B 実行順・状態遷移');
  });

  it('leaves a launched Drill for Home only after confirming 終了', async () => {
    const user = setup();
    await user.click(screen.getByRole('link', { name: /^すべて/ }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: '終了' }));
    expect(screen.getByRole('status').textContent).toBe(`1 / ${questions.length} 問`);
    await user.click(screen.getByRole('button', { name: '終了' }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('region', { name: 'ドリル' })).not.toBeNull();
    confirm.mockRestore();
  });

  it('restores the last-used settings on the next visit', () => {
    window.localStorage.setItem(DRILL_PREFERENCES_STORAGE_KEY, JSON.stringify({ order: 'random', tempo: 'slow' }));
    setup();
    expect(screen.getByRole('button', { name: /出題設定/ }).textContent).toContain('ランダム · ゆっくり');
  });

  it('links the other screens as rows', () => {
    setup();
    const others = within(screen.getByRole('region', { name: 'そのほか' }));
    expect(others.getByRole('link', { name: /^復習/ }).getAttribute('href')).toBe('/review');
    expect(others.getByRole('link', { name: '問題一覧' }).getAttribute('href')).toBe('/questions');
    expect(others.getByRole('link', { name: '用語集' }).getAttribute('href')).toBe('/glossary');
    expect(others.getByRole('link', { name: '戦績' }).getAttribute('href')).toBe('/stats');
  });

  it('hides the course rows when the content is invalid', () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes questions={[...questions, questions[0]!]} glossary={glossary} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('region', { name: 'ドリル' })).toBeNull();
    expect(screen.getByText('教材データ：エラー')).not.toBeNull();
  });
});
