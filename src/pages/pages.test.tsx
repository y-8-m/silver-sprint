// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import AppRoutes from '../app/router';
import { glossary } from '../data/glossary';
import { code, term, text } from '../data/helpers';
import { questions } from '../data/questions';
import type { GlossaryDictionary, Question } from '../data/types';

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
afterEach(cleanup);
afterAll(() => {
  for (const [name, descriptor] of [['showModal', originalShow], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

function setup(path = '/', data: { questions?: Question[]; glossary?: GlossaryDictionary } = {}) {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes questions={data.questions ?? questions} glossary={data.glossary ?? glossary} />
    </MemoryRouter>,
  );
  return { user, ...view };
}

describe('Pages and routing', () => {
  it('navigates Home, Questions, and Glossary with a current-page indicator', async () => {
    const { user } = setup();
    expect(screen.getByText('Questions: 5')).not.toBeNull();
    expect(screen.getByText('Glossary entries: 6')).not.toBeNull();
    expect(screen.getByText('Data validation: OK')).not.toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
    const nav = within(screen.getByRole('navigation'));
    expect(nav.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    await user.click(nav.getByRole('link', { name: 'Questions' }));
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(nav.getByRole('link', { name: 'Questions' }).getAttribute('aria-current')).toBe('page');
    await user.click(nav.getByRole('link', { name: 'Glossary' }));
    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(nav.getByRole('link', { name: 'Glossary' }).getAttribute('aria-current')).toBe('page');
    await user.click(nav.getByRole('link', { name: 'Home' }));
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('uses category and topic as AND filters and reports an empty result', async () => {
    const { user } = setup('/questions');
    expect(screen.getByRole('status').textContent).toBe('5 / 5 questions');
    await user.selectOptions(screen.getByLabelText('Question category'), 'B');
    expect(screen.getByRole('status').textContent).toBe('2 / 5 questions');
    expect(screen.getAllByRole('article').every((article) => article.textContent?.includes('[B]'))).toBe(true);
    await user.selectOptions(screen.getByLabelText('Topic'), '後置インクリメント');
    expect(screen.getByRole('status').textContent).toBe('1 / 5 questions');
    expect(screen.getByRole('article').getAttribute('data-question-id')).toBe('post-increment-output');
    await user.selectOptions(screen.getByLabelText('Topic'), 'ローカル変数の初期化');
    expect(screen.getByRole('status').textContent).toBe('0 / 5 questions');
    expect(screen.getByText('条件に一致する問題はありません。')).not.toBeNull();
    await user.selectOptions(screen.getByLabelText('Question category'), '');
    expect(screen.getByRole('status').textContent).toBe('1 / 5 questions');
  });

  it('derives topic options from the supplied questions', () => {
    setup('/questions', { questions: [{ ...questions[0]!, topic: '追加候補テスト' }] });
    expect(screen.getByRole('option', { name: '追加候補テスト' })).not.toBeNull();
    expect(screen.queryByRole('option', { name: '後置インクリメント' })).toBeNull();
  });

  it('starts with collapsed answers and expands them using native details', async () => {
    const { user } = setup('/questions');
    const cards = screen.getAllByRole('article');
    expect(cards.every((card) => card.querySelector('details')?.open === false)).toBe(true);
    const card = cards[1]!;
    await user.click(within(card).getByText('答え・解説'));
    expect(card.querySelector('details')?.open).toBe(true);
    expect(within(card).getByRole('heading', { name: 'Answer' })).not.toBeNull();
    expect(within(card).getByRole('heading', { name: 'Explanation' })).not.toBeNull();
    expect(within(card).getAllByText('2:1').length).toBeGreaterThan(0);
  });

  it('retains glossary hover and detail interactions in question explanations', async () => {
    const { user } = setup('/questions');
    const card = screen.getAllByRole('article')[1]!;
    await user.click(within(card).getByText('答え・解説'));
    const trigger = within(card).getByRole('button', { name: '後置インクリメント' });
    await user.hover(trigger);
    expect(screen.getByRole('tooltip').textContent).toContain('増やす前の値');
    await user.click(trigger);
    expect(screen.queryByRole('dialog', { name: '後置インクリメント' })).not.toBeNull();
  });

  it('keeps filters local to the mounted page', async () => {
    const { user } = setup('/questions');
    await user.selectOptions(screen.getByLabelText('Question category'), 'B');
    const nav = within(screen.getByRole('navigation'));
    await user.click(nav.getByRole('link', { name: 'Glossary' }));
    await user.click(nav.getByRole('link', { name: 'Questions' }));
    expect(screen.getByRole('status').textContent).toBe('5 / 5 questions');
  });

  it.each([
    ['term', '後置インクリメント', 'postIncrement'],
    ['category', '演算子', 'postIncrement'],
    ['short', '式の値', 'postIncrement'],
    ['inline code ignoring case', 'NULL', 'reference'],
  ])('searches glossary %s', async (_field, query, id) => {
    const { user } = setup('/glossary');
    await user.type(screen.getByLabelText('用語検索'), query);
    expect(screen.getByRole('status').textContent).toBe('1 / 6 glossary entries');
    expect(screen.getByRole('article').getAttribute('data-glossary-entry-id')).toBe(id);
  });

  it('searches the displayed text of glossary references inside short', async () => {
    const { user } = setup('/glossary', { questions: [], glossary: {
      alias: { term: 'Alias', category: 'テスト', short: [text('prefix '), code('TOKEN'), term('known', 'CrossRef')] },
      known: { term: 'Known', category: 'テスト', short: [text('説明')] },
    } });
    await user.type(screen.getByLabelText('用語検索'), 'crossref');
    expect(screen.getByRole('article').getAttribute('data-glossary-entry-id')).toBe('alias');
    expect(within(screen.getByRole('article')).getByText('CrossRef').tagName).toBe('SPAN');
  });

  it('combines glossary search and category and displays the empty state', async () => {
    const { user } = setup('/glossary');
    await user.selectOptions(screen.getByLabelText('Glossary category'), '変数');
    expect(screen.getByRole('status').textContent).toBe('2 / 6 glossary entries');
    await user.type(screen.getByLabelText('用語検索'), 'ローカル');
    expect(screen.getByRole('status').textContent).toBe('1 / 6 glossary entries');
    await user.selectOptions(screen.getByLabelText('Glossary category'), '演算子');
    expect(screen.getByText('条件に一致する用語はありません。')).not.toBeNull();
    await user.clear(screen.getByLabelText('用語検索'));
    expect(screen.getByRole('status').textContent).toBe('1 / 6 glossary entries');
    await user.type(screen.getByLabelText('用語検索'), '存在しない検索文字列');
    expect(screen.getByRole('status').textContent).toBe('0 / 6 glossary entries');
    expect(screen.getByText('条件に一致する用語はありません。')).not.toBeNull();
  });

  it('derives glossary categories from the supplied dictionary', () => {
    setup('/glossary', { questions: [], glossary: { custom: { term: '独自用語', category: '独自カテゴリ', short: [text('説明')] } } });
    expect(screen.getByRole('option', { name: '独自カテゴリ' })).not.toBeNull();
    expect(screen.queryByRole('option', { name: '変数' })).toBeNull();
  });

  it('opens the shared existing dialog from the glossary list and switches related terms', async () => {
    const { user, container } = setup('/glossary');
    const originalDialog = container.querySelector('dialog');
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'コンストラクタの詳細' }));
    const dialog = screen.getByRole('dialog', { name: 'コンストラクタ' });
    expect(dialog).toBe(originalDialog);
    const related = dialog.querySelector('li button') as HTMLButtonElement;
    await user.click(related);
    expect(screen.getByRole('dialog', { name: '明示的コンストラクタ呼び出し' })).toBe(dialog);
    expect(container.querySelectorAll('dialog')).toHaveLength(1);
    await user.click(within(dialog).getByRole('button', { name: '閉じる' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each(['/questions', '/glossary'])('blocks invalid content on %s and reports diagnostics on Home', async (path) => {
    const { user } = setup(path, { questions: [...questions, questions[0]!] });
    expect(screen.getByRole('alert').textContent).toContain('教材データにエラー');
    expect(screen.queryByRole('article')).toBeNull();
    await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Home' }));
    expect(screen.getByText('Data validation: ERROR')).not.toBeNull();
    expect(screen.getByText('questions[5].id')).not.toBeNull();
    expect(screen.getByText(/Question ID .* is duplicated/)).not.toBeNull();
  });
});
