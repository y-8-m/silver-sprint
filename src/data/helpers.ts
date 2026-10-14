import type { CodeInline, GlossaryInline, TextInline } from './types';

export function text(value: string): TextInline {
  return { type: 'text', text: value };
}

export function code(value: string): CodeInline {
  return { type: 'code', text: value };
}

export function term(glossaryId: string, label: string): GlossaryInline {
  return { type: 'glossary', glossaryId, text: label };
}
