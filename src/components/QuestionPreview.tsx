import type { Question } from '../data/types';
import BlockRenderer from './blocks/BlockRenderer';
import InlineRenderer from './InlineRenderer';
import styles from './QuestionPreview.module.css';

type QuestionPreviewProps = { question: Question; collapseAnswer?: boolean };

export default function QuestionPreview({ question, collapseAnswer = false }: QuestionPreviewProps) {
  const answerAndExplanation = (
    <>
      <section>
        <h3>Answer</h3>
        <p><InlineRenderer nodes={question.answer} /></p>
      </section>
      <section>
        <h3>Explanation</h3>
        {question.explanation.map((block, index) => <BlockRenderer block={block} key={index} />)}
      </section>
    </>
  );
  return (
    <article className={styles.question} data-question-id={question.id}>
      <h2>[{question.category}] {question.topic}</h2>
      <section>
        <h3>Question</h3>
        {question.prompt.map((block, index) => (
          <BlockRenderer block={block} key={index} />
        ))}
      </section>
      {collapseAnswer ? (
        <details className={styles.details}>
          <summary>答え・解説</summary>
          {answerAndExplanation}
        </details>
      ) : answerAndExplanation}
    </article>
  );
}
