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

  it.each(['mixed', 'A', 'B', 'C', 'D'] as const)('starts course %s immediately with the saved settings', async (course) => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /出題設定/ }));
    await user.click(screen.getByRole('radio', { name: 'ゆっくり' }));
    await user.click(screen.getByRole('radio', { name: 'ランダム' }));
    const links = within(screen.getByRole('region', { name: 'ドリル' })).getAllByRole('link');
    const link = links[course === 'mixed' ? 0 : ['A', 'B', 'C', 'D'].indexOf(course) + 1]!;
    expect(link.getAttribute('href')).toBe(`/drill?course=${course}&order=random&tempo=slow`);
    await user.click(link);
    const matching = course === 'mixed' ? questions : questions.filter((question) => question.category === course);
    expect(screen.getByRole('status').textContent).toBe(`1 / ${matching.length} 問`);
    expect(screen.queryByRole('button', { name: '開始' })).toBeNull();
    expect(matching.some((question) => question.id === screen.getByRole('article').getAttribute('data-question-id'))).toBe(true);
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

  it('shows four independent h2 sections and keeps the Home brand and help', () => {
    setup();
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('heading', { name: 'Silver Sprint' })).not.toBeNull();
    expect(header.getByText('Java Silver SE 17 対策')).not.toBeNull();
    expect(header.getByRole('button', { name: '使い方' }).textContent).toBe('使い方');
    expect(header.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('heading', { name: '学ぶ' })).toBeNull();
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['ドリル', '復習', '調べる', '振り返る']);
    const drill = screen.getByRole('region', { name: 'ドリル' });
    const review = screen.getByRole('region', { name: '復習' });
    expect(drill.parentElement).toBe(screen.getByRole('main'));
    expect(review.parentElement).toBe(screen.getByRole('main'));
    expect(within(review).getByRole('heading', { name: '復習', level: 2 }).closest('a')).toBeNull();
    expect(within(review).getByRole('link', { name: /問題を解き直す/ }).getAttribute('href')).toBe('/review');
    const lookup = within(screen.getByRole('region', { name: '調べる' }));
    expect(lookup.getByRole('link', { name: '問題一覧' }).getAttribute('href')).toBe('/questions');
    expect(lookup.getByRole('link', { name: '用語集' }).getAttribute('href')).toBe('/glossary');
    expect(within(screen.getByRole('region', { name: '振り返る' })).getByRole('link', { name: '戦績' }).getAttribute('href')).toBe('/stats');
    expect(screen.queryByRole('heading', { name: 'そのほか' })).toBeNull();
  });

  it.each([
    ['問題一覧', '問題一覧'], ['用語集', '用語集'], ['戦績', '戦績'],
    [/問題を解き直す/, '復習'],
  ])('navigates from the Home row %s', async (name, title) => {
    const user = setup();
    await user.click(screen.getByRole('link', { name }));
    expect(screen.getByRole('heading', { name: title })).not.toBeNull();
    await user.click(screen.getByRole('link', { name: '← ホーム' }));
    expect(screen.getByRole('heading', { name: 'Silver Sprint' })).not.toBeNull();
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
