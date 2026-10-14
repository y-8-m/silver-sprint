export type Category = 'A' | 'B' | 'C' | 'D';

export type TextInline = {
  type: 'text';
  text: string;
};

export type CodeInline = {
  type: 'code';
  text: string;
};

export type GlossaryInline = {
  type: 'glossary';
  glossaryId: string;
  text: string;
};

export type InlineNode = TextInline | CodeInline | GlossaryInline;

export type TextBlock = {
  type: 'text';
  content: InlineNode[];
};

export type CodeBlock = {
  type: 'code';
  language: 'java';
  code: string;
};

export type StepsBlock = {
  type: 'steps';
  items: InlineNode[][];
};

export type ComparisonColumn = {
  key: string;
  label: string;
};

export type ComparisonRow = {
  id: string;
  cells: Record<string, InlineNode[]>;
  highlight?: boolean;
};

export type ComparisonBlock = {
  type: 'comparison';
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
};

export type PromptBlock = TextBlock | CodeBlock;

export type ExplanationBlock =
  | TextBlock
  | CodeBlock
  | StepsBlock
  | ComparisonBlock;

export type Question = {
  id: string;
  category: Category;
  topic: string;
  timeWeight?: number;
  prompt: PromptBlock[];
  answer: InlineNode[];
  explanation: ExplanationBlock[];
};

export type GlossaryEntry = {
  term: string;
  category: string;
  short: InlineNode[];
  detail?: ExplanationBlock[];
  related?: string[];
};

export type GlossaryDictionary = Record<string, GlossaryEntry>;
