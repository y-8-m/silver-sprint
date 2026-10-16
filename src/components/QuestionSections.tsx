import type { Question } from '../data/types';
import BlockRenderer from './blocks/BlockRenderer';
import InlineRenderer from './InlineRenderer';

type SectionProps = {
  question: Question;
  headingLevel: 3 | 4;
  className?: string;
};

export function PromptSection({ question, headingLevel, className }: SectionProps) {
  const H = `h${headingLevel}` as const;
  return (
    <section className={className}>
      <H>問題</H>
      {question.prompt.map((block, index) => <BlockRenderer block={block} key={index} />)}
    </section>
  );
}

export function AnswerAndExplanationSections({ question, headingLevel, className }: SectionProps) {
  const H = `h${headingLevel}` as const;
  return (
    <>
      <section className={className}>
        <H>答え</H>
        <p><InlineRenderer nodes={question.answer} /></p>
      </section>
      <section className={className}>
        <H>解説</H>
        {question.explanation.map((block, index) => <BlockRenderer block={block} key={index} />)}
      </section>
    </>
  );
}
