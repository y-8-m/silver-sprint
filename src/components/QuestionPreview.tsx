import type { Question } from '../data/types';
import { AnswerAndExplanationSections, PromptSection } from './QuestionSections';
import styles from './QuestionPreview.module.css';

type QuestionPreviewProps = { question: Question; collapseAnswer?: boolean };

export default function QuestionPreview({ question, collapseAnswer = false }: QuestionPreviewProps) {
  const answerAndExplanation = <AnswerAndExplanationSections question={question} headingLevel={3} />;
  return (
    <article className={styles.question} data-question-id={question.id}>
      <h2>[{question.category}] {question.topic}</h2>
      <PromptSection question={question} headingLevel={3} />
      {collapseAnswer ? (
        <details className={styles.details}>
          <summary>答え・解説</summary>
          {answerAndExplanation}
        </details>
      ) : answerAndExplanation}
    </article>
  );
}
