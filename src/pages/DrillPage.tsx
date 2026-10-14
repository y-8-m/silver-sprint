import { useMemo, useReducer } from 'react';
import { Link } from 'react-router-dom';
import BlockRenderer from '../components/blocks/BlockRenderer';
import InlineRenderer from '../components/InlineRenderer';
import type { Question } from '../data/types';
import { createInitialDrillState, drillReducer } from '../drill/drillReducer';
import { getCurrentQuestionId, getCurrentQuestionNumber, getTotalQuestions, isLastQuestion } from '../drill/drillSelectors';
import styles from './DrillPage.module.css';

export default function DrillPage({ questions, valid }: { questions: Question[]; valid: boolean }) {
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);
  const questionsById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const [state, dispatch] = useReducer(drillReducer, questionIds, createInitialDrillState);
  const total = getTotalQuestions(state);

  if (!valid) {
    return <><h2>Drill</h2><p role="alert">教材データにエラーがあるため開始できません。<Link to="/">Home</Link>で検証結果を確認してください。</p></>;
  }

  if (state.phase === 'ready') {
    return (
      <>
        <h2>Drill</h2>
        <p>{total > 0 ? `全${total}問を順番に出題します。` : '出題できる問題がありません。'}</p>
        <button className={styles.action} type="button" disabled={total === 0} onClick={() => dispatch({ type: 'START' })}>開始</button>
      </>
    );
  }

  if (state.phase === 'finished') {
    return (
      <section className={styles.finished}>
        <h2>Drill Complete</h2>
        <p>{total} / {total} questions completed</p>
        <button className={styles.action} type="button" onClick={() => dispatch({ type: 'RESET' })}>もう一度</button>
      </section>
    );
  }

  const id = getCurrentQuestionId(state);
  const question = id === undefined ? undefined : questionsById.get(id);
  if (!question) {
    return (
      <>
        <h2>Drill</h2>
        <p role="alert">問題データを取得できません。</p>
        <button className={styles.action} type="button" onClick={() => dispatch({ type: 'RESET' })}>最初に戻る</button>
      </>
    );
  }

  return (
    <>
      <h2>Drill</h2>
      <p className={styles.progress} role="status">Question {getCurrentQuestionNumber(state)} / {total}</p>
      <article data-question-id={question.id}>
        <h3>[{question.category}] {question.topic}</h3>
        <section className={styles.area}>
          <h4>Question</h4>
          {question.prompt.map((block, index) => <BlockRenderer block={block} key={index} />)}
        </section>
        {state.phase === 'answer' && (
          <>
            <section className={styles.area}>
              <h4>Answer</h4>
              <p><InlineRenderer nodes={question.answer} /></p>
            </section>
            <section className={styles.area}>
              <h4>Explanation</h4>
              {question.explanation.map((block, index) => <BlockRenderer block={block} key={index} />)}
            </section>
          </>
        )}
      </article>
      {state.phase === 'question' ? (
        <button className={styles.action} type="button" onClick={() => dispatch({ type: 'REVEAL_ANSWER' })}>答えを見る</button>
      ) : (
        <button className={styles.action} type="button" onClick={() => dispatch({ type: 'NEXT' })}>{isLastQuestion(state) ? '完了' : '次へ'}</button>
      )}
    </>
  );
}
