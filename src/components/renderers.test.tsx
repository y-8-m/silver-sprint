import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import QuestionPreview from './QuestionPreview';
import { glossary } from '../data/glossary';
import { code, term, text } from '../data/helpers';
import { questions } from '../data/questions';
import type { ComparisonBlock, ExplanationBlock } from '../data/types';
import BlockRenderer from './blocks/BlockRenderer';
import CodeBlockView from './blocks/CodeBlockView';
import ComparisonBlockView from './blocks/ComparisonBlockView';
import StepsBlockView from './blocks/StepsBlockView';
import blockStyles from './blocks/Blocks.module.css';
import InlineRenderer from './InlineRenderer';
import inlineStyles from './InlineRenderer.module.css';

describe('InlineRenderer', () => {
  it('renders text without element wrappers and escapes markup', () => {
    expect(renderToStaticMarkup(
      <InlineRenderer nodes={[text('前'), text('<b>後</b>')]} />,
    )).toBe('前&lt;b&gt;後&lt;/b&gt;');
    expect(renderToStaticMarkup(<InlineRenderer nodes={[]} />)).toBe('');
  });

  it('preserves inline order and uses a plain glossary fallback without a Provider', () => {
    const html = renderToStaticMarkup(
      <InlineRenderer nodes={[text('前'), code('x++'), term('postIncrement', '後置インクリメント'), text('後')]} />,
    );

    expect(html).toBe(
      `前<code class="${inlineStyles.code}">x++</code>` +
      `<span class="${inlineStyles.glossary}" data-glossary-id="postIncrement">後置インクリメント</span>後`,
    );
  });
});

describe('Block views', () => {
  it('preserves code line breaks and indentation while escaping Java operators', () => {
    const html = renderToStaticMarkup(
      <CodeBlockView block={{ type: 'code', language: 'java', code: 'if (x < 2 && y > 0) {\n    x++;\n}' }} />,
    );

    expect(html).toContain('<pre ');
    expect(html).toContain('<code data-language="java">if (x &lt; 2 &amp;&amp; y &gt; 0) {\n    x++;\n}</code>');
  });

  it('renders ordered steps and their inline code and glossary references', () => {
    const html = renderToStaticMarkup(
      <StepsBlockView block={{
        type: 'steps',
        items: [[text('先に実行')], [code('x++'), term('postIncrement', '後置インクリメント')]],
      }} />,
    );

    expect(html).toContain('<ol ');
    expect(html).toContain('<li>先に実行</li><li><code ');
    expect(html).toContain('data-glossary-id="postIncrement"');
    expect(html.match(/<li>/g)).toHaveLength(2);
  });

  it('uses column order rather than cell insertion order and highlights only marked rows', () => {
    const block: ComparisonBlock = {
      type: 'comparison',
      columns: [{ key: 'second', label: '列2' }, { key: 'first', label: '列1' }],
      rows: [
        {
          id: 'highlighted',
          highlight: true,
          cells: { first: [text('値1')], second: [text('値2')] },
        },
        {
          id: 'ordinary',
          cells: { first: [term('constructor', 'コンストラクタ')], second: [code('this()')] },
        },
      ],
    };
    const html = renderToStaticMarkup(<ComparisonBlockView block={block} />);

    expect(html).toContain('<th scope="col">列2</th><th scope="col">列1</th>');
    expect(html).toContain(`<tr class="${blockStyles.highlight}"><td>値2</td><td>値1</td></tr>`);
    expect(html).toContain('<tr><td><code ');
    expect(html).toContain('data-glossary-id="constructor"');
    expect(html.match(/<tr class=/g)).toHaveLength(1);
    expect(html).toContain(`class="${blockStyles.tableScroll}"`);
  });
});

describe('BlockRenderer', () => {
  it.each<{ name: string; block: ExplanationBlock; expected: string }>([
    { name: 'text', block: { type: 'text', content: [text('文章'), code('null')] }, expected: '<p' },
    { name: 'code', block: { type: 'code', language: 'java', code: 'int x = 1;' }, expected: '<pre' },
    { name: 'steps', block: { type: 'steps', items: [[text('手順')]] }, expected: '<ol' },
    {
      name: 'comparison',
      block: {
        type: 'comparison',
        columns: [{ key: 'value', label: '値' }],
        rows: [{ id: 'row', cells: { value: [text('内容')] } }],
      },
      expected: '<table',
    },
  ])('dispatches the $name block', ({ block, expected }) => {
    const html = renderToStaticMarkup(<BlockRenderer block={block} />);
    expect(html).toContain(expected);
    if (block.type === 'text') {
      expect(html).toContain('文章<code ');
    }
  });
});

describe('Content preview', () => {
  it('renders all questions with their category, topic, prompt, answer, and explanation', () => {
    const html = renderToStaticMarkup(
      <>{questions.map((question) => <QuestionPreview question={question} key={question.id} />)}</>,
    );
    expect(html.match(/<article\b/g)).toHaveLength(questions.length);
    expect(html.match(/<h3>問題<\/h3>/g)).toHaveLength(questions.length);
    expect(html.match(/<h3>答え<\/h3>/g)).toHaveLength(questions.length);
    expect(html.match(/<h3>解説<\/h3>/g)).toHaveLength(questions.length);
    questions.forEach((question) => {
      expect(html).toContain(`data-question-id="${question.id}"`);
      expect(html).toContain(`<h2>[${question.category}] ${question.topic}</h2>`);
    });
    expect(html).toContain('2:1</code>');
    expect(html).toContain('PCD</code>');
  });

  it('also renders glossary short and detail using the same renderers', () => {
    Object.values(glossary).forEach((entry) => {
      const html = renderToStaticMarkup(
        <>
          <InlineRenderer nodes={entry.short} />
          {entry.detail?.map((block, index) => <BlockRenderer block={block} key={index} />)}
        </>,
      );
      expect(html.length).toBeGreaterThan(0);
    });
  });
});
