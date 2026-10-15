// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import InlineRenderer from '../components/InlineRenderer';
import { code, term, text } from '../data/helpers';
import type { GlossaryDictionary } from '../data/types';
import GlossaryDetailDialog from './GlossaryDetailDialog';
import GlossaryProvider from './GlossaryProvider';

const dictionary = {
  alpha: {
    term: '用語A',
    category: 'テスト',
    short: [text('Aの短い説明'), code('x++'), term('beta', 'B参照')],
    detail: [{ type: 'text', content: [text('Aの詳細'), term('beta', 'Bへ切替')] }],
    related: ['gamma'],
  },
  beta: {
    term: '用語B',
    category: 'テスト',
    short: [text('Bの短い説明')],
    detail: [{ type: 'steps', items: [[code('b()')]] }],
    related: ['alpha'],
  },
  gamma: {
    term: '用語C',
    category: 'テスト',
    short: [text('Cの短い説明')],
    related: ['alpha'],
  },
} satisfies GlossaryDictionary;

// jsdom lacks the native dialog API. Model open/close only; real-browser QA
// covers Escape dispatch, focus trapping/restoration, and the modal top layer.
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
const close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
});

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: showModal });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: close });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
afterAll(() => {
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

function setup(id = 'alpha', glossary: GlossaryDictionary = dictionary) {
  const user = userEvent.setup();
  render(
    <GlossaryProvider glossary={glossary}>
      <p><InlineRenderer nodes={[term(id, '用語A')]} /></p>
      <button type="button">次へ</button>
      <GlossaryDetailDialog />
    </GlossaryProvider>,
  );
  return user;
}

describe('Glossary interactions', () => {
  it('shows short on pointer hover and hides it on pointer leave', async () => {
    const user = setup();
    const trigger = screen.getByRole('button', { name: '用語A' });
    await user.hover(trigger);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('Aの短い説明');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('keeps short references noninteractive while retaining inline code', async () => {
    const user = setup();
    await user.hover(screen.getByRole('button', { name: '用語A' }));
    const tooltip = screen.getByRole('tooltip');

    expect(within(tooltip).queryByRole('button')).toBeNull();
    expect(within(tooltip).getByText('B参照').tagName).toBe('SPAN');
    expect(tooltip.querySelector('code')?.textContent).toBe('x++');
  });

  it('shows short on keyboard focus, retains it after pointer leave, and hides it on blur', async () => {
    const user = setup();
    await user.tab();
    const trigger = screen.getByRole('button', { name: '用語A' });
    expect(document.activeElement).toBe(trigger);
    expect(screen.getByRole('tooltip').textContent).toContain('Aの短い説明');
    await user.hover(trigger);
    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeNull();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '次へ' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('dismisses the focused short tooltip with Escape', async () => {
    const user = setup();
    await user.tab();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '用語A' }));
  });

  it('opens detail on click and closes with the Close button', async () => {
    const user = setup();
    const trigger = screen.getByRole('button', { name: '用語A' });
    expect(trigger.getAttribute('data-glossary-id')).toBe('alpha');
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '用語A' });
    expect(dialog.textContent).toContain('カテゴリ: テスト');
    expect(dialog.textContent).toContain('Aの短い説明');
    expect(dialog.textContent).toContain('Aの詳細');
    expect(document.activeElement).toBe(within(dialog).getByRole('heading', { name: '用語A' }));
    await user.click(within(dialog).getByRole('button', { name: '閉じる' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens detail with the keyboard Enter key', async () => {
    const user = setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog', { name: '用語A' })).not.toBeNull();
  });

  it('opens detail on touch without leaving a hover tooltip visible', async () => {
    const user = setup();
    await user.pointer({ keys: '[TouchA]', target: screen.getByRole('button', { name: '用語A' }) });
    expect(screen.queryByRole('dialog', { name: '用語A' })).not.toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes when the native dialog emits its Escape cancel event', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '用語A' }));
    const event = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), event);
    expect(event.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('switches detail references in the same dialog without another showModal call', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '用語A' }));
    const dialog = screen.getByRole('dialog');
    const openingCalls = showModal.mock.calls.length;
    await user.click(within(dialog).getByRole('button', { name: 'Bへ切替' }));

    expect(screen.getByRole('dialog', { name: '用語B' })).toBe(dialog);
    expect(document.querySelectorAll('dialog')).toHaveLength(1);
    expect(showModal.mock.calls).toHaveLength(openingCalls);
    expect(dialog.querySelector('ol li code')?.textContent).toBe('b()');
    expect(dialog.textContent).not.toContain('Aの詳細');
  });

  it('shows short tooltips from interactive references within detail', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '用語A' }));
    const dialog = screen.getByRole('dialog');
    await user.hover(within(dialog).getByRole('button', { name: 'Bへ切替' }));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('Bの短い説明');
    expect(dialog.contains(tooltip)).toBe(true);
  });

  it('opens related terms that have no detail, and permits switching back', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '用語A' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '用語C' }));
    expect(screen.getByRole('dialog', { name: '用語C' })).toBe(dialog);
    expect(dialog.textContent).toContain('Cの短い説明');
    expect(within(dialog).queryByRole('button', { name: '閉じる' })).not.toBeNull();
    await user.click(within(dialog).getByRole('button', { name: '用語A' }));
    expect(screen.getByRole('dialog', { name: '用語A' })).toBe(dialog);
  });

  it('synchronizes provider selection after a native close event', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '用語A' }));
    act(() => (screen.getByRole('dialog') as HTMLDialogElement).close());
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: '用語A' }));
    expect(screen.queryByRole('dialog', { name: '用語A' })).not.toBeNull();
  });

  it.each(['missing', 'toString'])('falls back to plain text for unknown ID %s', async (id) => {
    const user = setup(id);
    const fallback = screen.getByText('用語A');
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback.getAttribute('data-glossary-id')).toBe(id);
    await user.hover(fallback);
    await user.click(fallback);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('reads short from the injected dictionary rather than global data', async () => {
    const user = setup('alpha', {
      alpha: { term: '用語A', category: '別辞書', short: [text('差し替えた説明')] },
    });
    await user.hover(screen.getByRole('button', { name: '用語A' }));
    expect(screen.getByRole('tooltip').textContent).toContain('差し替えた説明');
  });
});
