import { describe, expect, it } from 'vitest';
import { glossary } from './glossary';
import { term, text } from './helpers';
import { questions } from './questions';
import { additionalOperatorQuestions } from './questions/operators';
import { additionalControlFlowQuestions } from './questions/controlFlow';
import { additionalExecutionModelQuestions } from './questions/executionModel';
import { additionalObjectQuestions } from './questions/objects';
import { inlineNodesToText } from './inlineNodesToText';
import type { ComparisonBlock, GlossaryDictionary, Question } from './types';
import { validateContent } from './validate';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'sample',
    category: 'A',
    topic: 'テスト',
    prompt: [{ type: 'text', content: [text('問題')] }],
    answer: [text('答え')],
    explanation: [],
    ...overrides,
  };
}

function makeComparison(): ComparisonBlock {
  return {
    type: 'comparison',
    columns: [
      { key: 'name', label: '名前' },
      { key: 'description', label: '説明' },
    ],
    rows: [
      {
        id: 'first',
        cells: { name: [text('項目')], description: [text('説明')] },
      },
    ],
  };
}

const knownGlossary = {
  known: { term: '既知の用語', category: 'テスト', short: [text('説明')] },
} satisfies GlossaryDictionary;

const missingReference = term('missing', '存在しない用語');

describe('validateContent', () => {
  it('accepts all seventy-five questions and forty glossary entries with valid glossary references', () => {
    expect(questions).toHaveLength(75);
    expect(Object.keys(glossary)).toHaveLength(40);
    expect(validateContent(questions, glossary)).toEqual({ valid: true, issues: [] });
  });

  it('integrates the twelve-question variables unit with its intended category distribution', () => {
    const unitIds = new Set([
      'primitive-reference-kind', 'primitive-types', 'byte-constant-assignment',
      'float-literal-assignment', 'local-variable-initialization', 'definite-assignment-if',
      'definite-assignment-if-else', 'block-scope', 'for-variable-scope',
      'declaration-initializer-scope', 'primitive-copy', 'final-local-variable',
    ]);
    const unit = questions.filter((question) => unitIds.has(question.id));
    expect(unit).toHaveLength(12);
    expect(Object.fromEntries(['A', 'B', 'C', 'D'].map((category) => [
      category, unit.filter((question) => question.category === category).length,
    ]))).toEqual({ A: 1, B: 3, C: 7, D: 1 });
    expect(questions.slice(0, 16).filter((question) => !unitIds.has(question.id)).map((question) => question.id)).toEqual([
      'post-increment-output', 'inheritance-multiplicity', 'reference-variable-value', 'constructor-call-chain',
    ]);
  });

  it('appends all fourteen operator questions with the intended IDs and categories', () => {
    expect(additionalOperatorQuestions.map(({ id, category }) => [id, category])).toEqual([
      ['var-type-inference', 'A'],
      ['var-requires-initializer', 'C'],
      ['var-reassignment-type', 'C'],
      ['integer-division-before-assignment', 'B'],
      ['remainder-negative-dividend', 'B'],
      ['operator-precedence-multiplication', 'B'],
      ['prefix-postfix-increment-comparison', 'B'],
      ['short-addition-promotion', 'C'],
      ['short-compound-assignment', 'C'],
      ['double-to-int-cast', 'C'],
      ['short-circuit-and', 'B'],
      ['boolean-and-non-short-circuit', 'B'],
      ['short-circuit-or', 'B'],
      ['conditional-operator-evaluation', 'B'],
    ]);
    expect(questions.slice(16, 30)).toEqual(additionalOperatorQuestions);
    expect(new Set(questions.map(({ id }) => id)).size).toBe(75);
    expect(Object.fromEntries(['A', 'B', 'C', 'D'].map((category) => [
      category, additionalOperatorQuestions.filter((question) => question.category === category).length,
    ]))).toEqual({ A: 1, B: 8, C: 5, D: 0 });
  });

  it('preserves the IDs and order of the original sixteen questions', () => {
    expect(questions.slice(0, 16).map(({ id }) => id)).toEqual([
      'local-variable-initialization', 'post-increment-output', 'inheritance-multiplicity',
      'reference-variable-value', 'constructor-call-chain', 'primitive-reference-kind',
      'primitive-types', 'byte-constant-assignment', 'float-literal-assignment',
      'definite-assignment-if', 'definite-assignment-if-else', 'block-scope',
      'for-variable-scope', 'declaration-initializer-scope', 'primitive-copy', 'final-local-variable',
    ]);
  });

  it('sets timeWeight only on the five specified operator questions', () => {
    const weightedIds = new Set([
      'prefix-postfix-increment-comparison', 'short-circuit-and',
      'boolean-and-non-short-circuit', 'short-circuit-or', 'conditional-operator-evaluation',
    ]);
    for (const question of additionalOperatorQuestions) {
      expect(question.timeWeight, question.id).toBe(weightedIds.has(question.id) ? 1.5 : undefined);
    }
  });

  it('adds the eight operator glossary entries with the intended Japanese terms and categories', () => {
    expect(Object.entries(glossary).slice(9, 17).map(([id, { term, category }]) => [id, term, category])).toEqual([
      ['localVariableTypeInference', 'ローカル変数の型推論', '変数'],
      ['remainderOperator', '剰余演算子', '演算子'],
      ['prefixIncrement', '前置インクリメント', '演算子'],
      ['binaryNumericPromotion', '二項数値昇格', '型'],
      ['compoundAssignment', '複合代入演算子', '演算子'],
      ['explicitCast', 'キャスト', '型'],
      ['shortCircuitEvaluation', '短絡評価', '演算子'],
      ['conditionalOperator', '条件演算子', '演算子'],
    ]);
  });

  it('appends the fifteen control-flow questions with the specified categories and answers', () => {
    expect(questions.slice(30, 45)).toEqual(additionalControlFlowQuestions);
    expect(additionalControlFlowQuestions.map((question) => [
      question.id, question.category, inlineNodesToText(question.answer),
    ])).toEqual([
      ['if-dangling-else', 'B', '2'],
      ['if-int-condition', 'C', 'コンパイルエラー。'],
      ['switch-colon-fall-through', 'B', 'BCD'],
      ['switch-arrow-no-fall-through', 'B', 'BX'],
      ['switch-expression-yield-value', 'B', '21'],
      ['switch-expression-non-exhaustive', 'C', 'コンパイルエラー。'],
      ['switch-long-selector', 'C', 'コンパイルエラー。'],
      ['switch-duplicate-constant', 'C', 'コンパイルエラー。'],
      ['for-condition-update-order', 'B', '012:3'],
      ['for-continue-update', 'B', '4'],
      ['while-do-while-first-check', 'B', 'D'],
      ['enhanced-for-primitive-copy', 'B', '1:3'],
      ['switch-expression-block-missing-yield', 'C', 'コンパイルエラー。'],
      ['labeled-break-nested-loop', 'B', '4'],
      ['labeled-continue-nested-loop', 'B', '3'],
    ]);
    const counts = (data: Question[]) => Object.fromEntries(['A', 'B', 'C', 'D'].map((category) => [
      category, data.filter((question) => question.category === category).length,
    ]));
    expect(counts(questions.slice(0, 30))).toEqual({ A: 3, B: 13, C: 13, D: 1 });
    expect(counts(additionalControlFlowQuestions)).toEqual({ A: 0, B: 10, C: 5, D: 0 });
    expect(counts(questions)).toEqual({ A: 18, B: 38, C: 18, D: 1 });
  });

  it('sets timeWeight only on the six specified control-flow questions', () => {
    const weightedIds = new Set([
      'if-dangling-else', 'switch-colon-fall-through', 'switch-expression-yield-value',
      'switch-expression-block-missing-yield', 'labeled-break-nested-loop', 'labeled-continue-nested-loop',
    ]);
    for (const question of additionalControlFlowQuestions) {
      expect(question.timeWeight, question.id).toBe(weightedIds.has(question.id) ? 1.5 : undefined);
    }
  });

  it('adds eight distinct control-flow glossary IDs after the original seventeen entries', () => {
    const entries = Object.entries(glossary).slice(17, 25);
    expect(entries.map(([id, entry]) => [id, entry.term, entry.category])).toEqual([
      ['danglingElse', 'elseの対応関係', '制御構文'],
      ['switchFallThrough', 'フォールスルー', '制御構文'],
      ['switchRule', 'switchルール', '制御構文'],
      ['switchExpression', 'switch式', '制御構文'],
      ['yieldStatement', 'yield文', '制御構文'],
      ['switchExhaustiveness', 'switch式の網羅性', '制御構文'],
      ['enhancedFor', '拡張for文', '制御構文'],
      ['labeledJump', 'ラベル付きbreak / continue', '制御構文'],
    ]);
    const originalIds = Object.keys(glossary).slice(0, 17);
    expect(entries.every(([id]) => !originalIds.includes(id))).toBe(true);
    expect(new Set(Object.keys(glossary)).size).toBe(40);
  });

  it('appends fifteen independent concept questions with the specified IDs and weights', () => {
    const additions: Question[] = [...additionalExecutionModelQuestions, ...additionalObjectQuestions];
    expect(additionalExecutionModelQuestions).toHaveLength(8);
    expect(additionalObjectQuestions).toHaveLength(7);
    expect(questions.slice(45, 60)).toEqual(additions);
    expect(additions.map(({ id }) => id)).toEqual([
      'java-compilation-execution', 'class-instance-distinction',
      'default-initialization-distinction', 'object-identity-aliasing',
      'null-empty-string-distinction', 'array-reference-element-value',
      'string-immutability', 'array-arraylist-distinction',
      'constructor-method-purpose', 'instance-static-state', 'this-current-instance',
      'reference-argument-passing', 'overload-override-distinction',
      'declared-runtime-type-dispatch', 'interface-implementation-reference',
    ]);
    const weightedIds = new Set([
      'reference-argument-passing', 'overload-override-distinction', 'declared-runtime-type-dispatch',
    ]);
    for (const question of additions) {
      expect(question.category, question.id).toBe('A');
      expect(question.timeWeight, question.id).toBe(weightedIds.has(question.id) ? 1.5 : undefined);
    }
  });

  it('adds fourteen linked concept terms without replacing existing glossary IDs', () => {
    const additions = Object.entries<GlossaryDictionary[string]>(glossary).slice(25, 39);
    expect(additions.map(([id]) => id)).toEqual([
      'class', 'instance', 'objectIdentity', 'staticMember', 'thisReference', 'immutable',
      'overload', 'override', 'polymorphism', 'interface', 'bytecode', 'jvm',
      'compileTimeType', 'runtimeType',
    ]);
    const explanations = JSON.stringify(questions.slice(45, 60).map(({ explanation }) => explanation));
    for (const [id, entry] of additions) {
      expect(entry.short.length, id).toBeGreaterThan(0);
      expect(entry.detail?.length, id).toBeGreaterThan(0);
      expect(entry.related?.length, id).toBeGreaterThan(0);
      expect(explanations, id).toContain(`"glossaryId":"${id}"`);
    }
  });

  it('detects a duplicate Question ID', () => {
    expect(validateContent([makeQuestion(), makeQuestion()], knownGlossary)).toEqual({
      valid: false,
      issues: [{ path: 'questions[1].id', message: 'Question ID "sample" is duplicated.' }],
    });
  });

  it.each<{ location: string; overrides: Partial<Question>; path: string }>([
    {
      location: 'prompt text',
      overrides: { prompt: [{ type: 'text', content: [missingReference] }] },
      path: 'questions[0].prompt[0].content[0].glossaryId',
    },
    {
      location: 'answer',
      overrides: { answer: [missingReference] },
      path: 'questions[0].answer[0].glossaryId',
    },
    {
      location: 'explanation text',
      overrides: { explanation: [{ type: 'text', content: [missingReference] }] },
      path: 'questions[0].explanation[0].content[0].glossaryId',
    },
    {
      location: 'steps',
      overrides: { explanation: [{ type: 'steps', items: [[missingReference]] }] },
      path: 'questions[0].explanation[0].items[0][0].glossaryId',
    },
    {
      location: 'comparison cells',
      overrides: {
        explanation: [{
          type: 'comparison',
          columns: [{ key: 'term', label: '用語' }],
          rows: [{ id: 'row', cells: { term: [missingReference] } }],
        }],
      },
      path: 'questions[0].explanation[0].rows[0].cells["term"][0].glossaryId',
    },
  ])('detects an unknown glossary reference in $location', ({ overrides, path }) => {
    expect(validateContent([makeQuestion(overrides)], knownGlossary)).toEqual({
      valid: false,
      issues: [{ path, message: 'Glossary ID "missing" does not exist.' }],
    });
  });

  it('detects an unknown related glossary ID', () => {
    const dictionary: GlossaryDictionary = {
      known: { ...knownGlossary.known, related: ['missing'] },
    };

    expect(validateContent([], dictionary)).toEqual({
      valid: false,
      issues: [{
        path: 'glossary["known"].related[0]',
        message: 'Related glossary ID "missing" does not exist.',
      }],
    });
  });

  it('validates glossary short and every detail block containing inline nodes', () => {
    const dictionary: GlossaryDictionary = {
      known: {
        ...knownGlossary.known,
        short: [missingReference],
        detail: [
          { type: 'text', content: [missingReference] },
          { type: 'code', language: 'java', code: 'int x = 1;' },
          { type: 'steps', items: [[missingReference]] },
          {
            type: 'comparison',
            columns: [{ key: 'term', label: '用語' }],
            rows: [{ id: 'row', cells: { term: [missingReference] } }],
          },
        ],
      },
    };

    const result = validateContent([], dictionary);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toEqual([
      'glossary["known"].short[0].glossaryId',
      'glossary["known"].detail[0].content[0].glossaryId',
      'glossary["known"].detail[2].items[0][0].glossaryId',
      'glossary["known"].detail[3].rows[0].cells["term"][0].glossaryId',
    ]);
  });

  it('detects duplicate comparison column keys', () => {
    const comparison = makeComparison();
    comparison.columns.push({ key: 'name', label: '重複' });

    expect(validateContent([makeQuestion({ explanation: [comparison] })], knownGlossary)).toEqual({
      valid: false,
      issues: [{
        path: 'questions[0].explanation[0].columns[2].key',
        message: 'Comparison column key "name" is duplicated.',
      }],
    });
  });

  it('detects duplicate row IDs within the same comparison block', () => {
    const comparison = makeComparison();
    comparison.rows.push({
      id: 'first',
      cells: { name: [text('項目2')], description: [text('説明2')] },
    });

    expect(validateContent([makeQuestion({ explanation: [comparison] })], knownGlossary)).toEqual({
      valid: false,
      issues: [{
        path: 'questions[0].explanation[0].rows[1].id',
        message: 'Comparison row ID "first" is duplicated.',
      }],
    });
  });

  it('allows the same row ID in different comparison blocks', () => {
    expect(validateContent([
      makeQuestion({ explanation: [makeComparison(), makeComparison()] }),
    ], knownGlossary)).toEqual({ valid: true, issues: [] });
  });

  it('detects duplicate comparison row IDs in glossary detail', () => {
    const comparison = makeComparison();
    comparison.rows.push({
      id: 'first',
      cells: { name: [text('項目2')], description: [text('説明2')] },
    });
    const dictionary: GlossaryDictionary = {
      known: { ...knownGlossary.known, detail: [comparison] },
    };

    expect(validateContent([], dictionary)).toEqual({
      valid: false,
      issues: [{
        path: 'glossary["known"].detail[0].rows[1].id',
        message: 'Comparison row ID "first" is duplicated.',
      }],
    });
  });

  it('detects a missing comparison cell in a later row', () => {
    const comparison = makeComparison();
    comparison.rows.push({ id: 'second', cells: { name: [text('項目2')] } });

    expect(validateContent([makeQuestion({ explanation: [comparison] })], knownGlossary)).toEqual({
      valid: false,
      issues: [{
        path: 'questions[0].explanation[0].rows[1].cells["description"]',
        message: 'Required comparison cell "description" is missing.',
      }],
    });
  });

  it('detects an extra cell and also checks references inside that cell', () => {
    const comparison = makeComparison();
    comparison.rows.push({
      id: 'second',
      cells: { name: [], description: [], extra: [missingReference] },
    });

    expect(validateContent([makeQuestion({ explanation: [comparison] })], knownGlossary)).toEqual({
      valid: false,
      issues: [
        {
          path: 'questions[0].explanation[0].rows[1].cells["extra"]',
          message: 'Comparison cell "extra" has no corresponding column.',
        },
        {
          path: 'questions[0].explanation[0].rows[1].cells["extra"][0].glossaryId',
          message: 'Glossary ID "missing" does not exist.',
        },
      ],
    });
  });

  it('checks comparison structure in glossary detail as well', () => {
    const comparison = makeComparison();
    comparison.rows.push({ id: 'second', cells: {} });

    const dictionary: GlossaryDictionary = {
      known: { ...knownGlossary.known, detail: [comparison] },
    };
    const result = validateContent([], dictionary);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toEqual([
      'glossary["known"].detail[0].rows[1].cells["name"]',
      'glossary["known"].detail[0].rows[1].cells["description"]',
    ]);
  });

  it('does not treat inherited object properties as glossary IDs or cells', () => {
    const comparison: ComparisonBlock = {
      type: 'comparison',
      columns: [{ key: 'toString', label: '名前' }],
      rows: [{ id: 'row', cells: {} }],
    };
    const dictionary: GlossaryDictionary = {
      known: { ...knownGlossary.known, related: ['toString'] },
    };
    const result = validateContent([
      makeQuestion({ answer: [term('toString', '用語')], explanation: [comparison] }),
    ], dictionary);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toEqual([
      'questions[0].answer[0].glossaryId',
      'questions[0].explanation[0].rows[0].cells["toString"]',
      'glossary["known"].related[0]',
    ]);
  });

  it('reports multiple independent issues without stopping at the first', () => {
    const result = validateContent([
      makeQuestion({ answer: [missingReference] }),
      makeQuestion(),
    ], {
      known: { ...knownGlossary.known, related: ['missing'] },
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toEqual([
      'questions[0].answer[0].glossaryId',
      'questions[1].id',
      'glossary["known"].related[0]',
    ]);
  });

  it.each([1, 1.5, 0.5])('accepts timeWeight %s and an omitted timeWeight', (timeWeight) => {
    expect(validateContent([makeQuestion({ timeWeight }), makeQuestion({ id: 'other' })], knownGlossary).valid).toBe(true);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects timeWeight %s', (timeWeight) => {
    const result = validateContent([makeQuestion(), makeQuestion({ id: 'other', timeWeight })], knownGlossary);
    expect(result.issues.map((issue) => issue.path)).toEqual(['questions[1].timeWeight']);
  });
});
