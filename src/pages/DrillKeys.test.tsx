// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import { STATS_STORAGE_KEY } from '../stats/localStorageStatsRepository';

// jsdom does not implement native showModal/close; browser QA covers modality.
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
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
afterAll(() => {
  for (const [name, descriptor] of [['showModal', originalShow], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

function setup(path = '/drill?course=mixed') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes questions={questions} glossary={glossary} />
    </MemoryRouter>,
  );
}

const progress = () => screen.getByRole('status').textContent;
const press = (key: string) => fireEvent.keyDown(document.body, { key });

describe('Drill key operations', () => {
  it('Space pauses and resumes in both phases', () => {
    setup();
    expect(screen.getByRole('button', { name: '一時停止' })).not.toBeNull();
    press(' ');
    expect(screen.getByRole('button', { name: '再開' })).not.toBeNull();
    expect(screen.getByText('一時停止中')).not.toBeNull();
    press(' ');
    expect(screen.getByRole('button', { name: '一時停止' })).not.toBeNull();
    press('Enter');
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
    press(' ');
    expect(screen.getByRole('button', { name: '再開' })).not.toBeNull();
  });

  it('Enter reveals the answer, then moves on without rating', () => {
    setup();
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    press('Enter');
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
    press('Enter');
    expect(progress()).toBe(`2 / ${questions.length} 問`);
    expect(window.localStorage.getItem(STATS_STORAGE_KEY)).toBeNull();
  });

  it('1 / 2 / 3 rate only in the answer phase and advance', () => {
    setup();
    press('1');
    expect(progress()).toBe(`1 / ${questions.length} 問`);
    expect(window.localStorage.getItem(STATS_STORAGE_KEY)).toBeNull();
    for (const [key, field] of [['1', 'knownCount'], ['2', 'unsureCount'], ['3', 'unknownCount']] as const) {
      press('Enter');
      press(key);
      const stored = JSON.parse(window.localStorage.getItem(STATS_STORAGE_KEY)!) as { questions: Record<string, Record<string, number>> };
      const counts = Object.values(stored.questions).map((record) => record[field]);
      expect(counts).toContain(1);
    }
    expect(progress()).toBe(`4 / ${questions.length} 問`);
  });

  it('leaves Space and Enter to a focused button', async () => {
    setup();
    const user = userEvent.setup();
    const pause = screen.getByRole('button', { name: '一時停止' });
    pause.focus();
    fireEvent.keyDown(pause, { key: 'Enter' });
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '再開' })).not.toBeNull();
  });

  it('ignores keys when modified or while the glossary dialog is open', async () => {
    setup();
    fireEvent.keyDown(document.body, { key: 'Enter', ctrlKey: true });
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    const user = userEvent.setup();
    press('Enter');
    await user.click(document.querySelector<HTMLElement>('[data-glossary-id]')!);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(progress()).toBe(`1 / ${questions.length} 問`);
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
  });
});

describe('Drill immersive mode', () => {
  it('hides the app header and navigation during a session and shows them again when finished', () => {
    setup();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('button', { name: '終了' })).not.toBeNull();
    expect(screen.getByRole('button', { name: '使い方' }).querySelector('svg')).not.toBeNull();
    for (let index = 0; index < questions.length; index++) {
      press('Enter');
      press('Enter');
    }
    expect(screen.getByRole('heading', { name: 'ドリル完了' })).not.toBeNull();
    expect(screen.getByRole('banner')).not.toBeNull();
    expect(screen.getByRole('link', { name: '← ホーム' })).not.toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('shows the common header on the ready screen', () => {
    setup('/drill');
    expect(screen.getByRole('banner')).not.toBeNull();
    expect(screen.getByRole('link', { name: '← ホーム' })).not.toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('button', { name: '開始' })).not.toBeNull();
  });
});

describe('Help sheet', () => {
  it.each(['/', '/questions', '/glossary', '/stats', '/drill', '/review'])('opens and closes the common Help dialog on %s without navigating', async (path) => {
    setup(path);
    const originalContent = screen.getByRole('main').textContent;
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '使い方' }));
    const dialog = screen.getByRole('dialog', { name: '使い方' });
    for (const key of ['Space', 'Enter', '1', '2', '3', 'Esc']) {
      expect(within(dialog).getByText(key, { selector: 'kbd' })).not.toBeNull();
    }
    expect(within(dialog).getByText('一時停止／再開')).not.toBeNull();
    expect(within(dialog).getByText(/答えを見る／次へ/)).not.toBeNull();
    await user.click(within(dialog).getByRole('button', { name: '閉じる' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main').textContent).toBe(originalContent);
  });

  it('is reachable during a session, pauses the timer and ignores keys while open', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '使い方' }));
    expect(screen.getByText('一時停止中')).not.toBeNull();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });
    expect(screen.queryByRole('heading', { name: '答え' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(screen.queryByText('一時停止中')).toBeNull();
    press('Enter');
    expect(screen.getByRole('heading', { name: '答え' })).not.toBeNull();
  });
});
