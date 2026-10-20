import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { glossary } from './glossary';
import { inlineNodesToText } from './inlineNodesToText';
import { questions } from './questions';
import { additionalReferenceFlowQuestions } from './questions/referenceFlow';
import { additionalObjectFlowQuestions } from './questions/objectFlow';
import type { Question } from './types';
import { validateContent } from './validate';

const expected = [
  ['reference-alias-field-update', '参照先の共有', '4:4'],
  ['reference-reassignment', '参照の再代入', '1:5'],
  ['primitive-parameter-copy', 'プリミティブ値の引数渡し', '5'],
  ['reference-parameter-mutation', '参照型引数の状態遷移', '7'],
  ['array-alias-mutation', '配列の参照共有', '2:5'],
  ['enhanced-for-object-mutation', '拡張forとオブジェクト', '2:3'],
  ['string-concat-reassignment', 'Stringと再代入', 'AC:A'],
  ['arraylist-alias-mutation', 'ArrayListの参照共有', '2:B'],
  ['constructor-this-field-update', 'thisとフィールドの更新', '3'],
  ['static-shared-counter', 'staticとインスタンスの状態', '1:2:2'],
  ['inheritance-initialization-order', '継承と初期化順', 'ABCDEF'],
  ['overload-declared-argument-type', 'オーバーロードの選択', 'A'],
  ['override-runtime-dispatch', 'オーバーライドの実行', 'CP'],
  ['field-hiding-vs-override', 'フィールドとメソッドの選択', '1C'],
  ['interface-runtime-dispatch', 'インタフェースと多態性', 'AB'],
];

const additions: Question[] = [...additionalReferenceFlowQuestions, ...additionalObjectFlowQuestions];
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('reference and object flow material', () => {
  it('preserves all previous question and glossary content in its original order', () => {
    // Captured from the complete 60-question / 39-term data before this addition.
    expect(digest(questions.slice(0, 60))).toBe('735779345a67b17488762d24b753cb42f35babc937e4c0555dd935ee2454e5fd');
    expect(digest(Object.fromEntries(Object.entries(glossary).slice(0, 39))))
      .toBe('e3a85425d19d0cb34b55b3f632554b23b40f34a0090da1e5bb9ec0877f5ecc8f');
  });

  it('appends the specified eight and seven questions in order with exact topics and answers', () => {
    expect(additionalReferenceFlowQuestions).toHaveLength(8);
    expect(additionalObjectFlowQuestions).toHaveLength(7);
    expect(questions.slice(60)).toEqual(additions);
    expect(additions.map((q) => [q.id, q.topic, inlineNodesToText(q.answer)])).toEqual(expected);
    expect(additions.every((q) => q.category === 'B')).toBe(true);
    expect(questions).toHaveLength(75);
    expect(new Set(questions.map((q) => q.id)).size).toBe(75);
    expect(Object.fromEntries(['A', 'B', 'C', 'D'].map((category) => [
      category, questions.filter((q) => q.category === category).length,
    ]))).toEqual({ A: 18, B: 38, C: 18, D: 1 });
  });

  it('sets timeWeight to 1.5 on exactly the six designated new questions', () => {
    const weighted = new Set([
      'reference-parameter-mutation', 'enhanced-for-object-mutation',
      'inheritance-initialization-order', 'overload-declared-argument-type',
      'field-hiding-vs-override', 'interface-runtime-dispatch',
    ]);
    for (const q of additions) {
      expect(q.timeWeight, q.id).toBe(weighted.has(q.id) ? 1.5 : undefined);
    }
  });

  it('adds only fieldHiding, links it from the explanation, and validates every term reference', () => {
    expect(Object.keys(glossary)).toHaveLength(40);
    expect(Object.keys(glossary).slice(39)).toEqual(['fieldHiding']);
    expect(glossary.fieldHiding.term).toBe('フィールドの隠蔽');
    expect(glossary.fieldHiding.short.length).toBeGreaterThan(0);
    expect(glossary.fieldHiding.detail.length).toBeGreaterThan(0);
    const question = additions.find((q) => q.id === 'field-hiding-vs-override')!;
    expect(question.explanation).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'text', content: expect.arrayContaining([
        expect.objectContaining({ type: 'glossary', glossaryId: 'fieldHiding' }),
      ]) }),
    ]));
    expect(validateContent(questions, glossary)).toEqual({ valid: true, issues: [] });
  });
});
