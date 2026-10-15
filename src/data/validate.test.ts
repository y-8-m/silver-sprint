import { describe, expect, it } from 'vitest';
import { glossary } from './glossary';
import { term, text } from './helpers';
import { questions } from './questions';
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
  it('accepts all five sample questions and six glossary entries', () => {
    expect(questions).toHaveLength(5);
    expect(Object.keys(glossary)).toHaveLength(6);
    expect(validateContent(questions, glossary)).toEqual({ valid: true, issues: [] });
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
