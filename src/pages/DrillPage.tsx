import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import BlockRenderer from '../components/blocks/BlockRenderer';
import InlineRenderer from '../components/InlineRenderer';
import InvalidContentNotice from '../components/InvalidContentNotice';
import type { Question } from '../data/types';
import { createInitialDrillState, drillReducer } from '../drill/drillReducer';
import type { DrillMode } from '../drill/drillTypes';
import { getCurrentQuestionId, getCurrentQuestionNumber, getTotalQuestions, isLastQuestion } from '../drill/drillSelectors';
import { buildQuestionSequence } from '../drill/sessionSequence';
import type { SessionSettings } from '../drill/sessionSequence';
import { getPhaseDurationMs } from '../drill/tempo';
import type { Tempo } from '../drill/tempo';
import { useDrillTimer } from '../drill/useDrillTimer';
import { useGlossary } from '../glossary/GlossaryContext';
import type { StatsRepository } from '../stats/statsRepository';
import { useStats } from '../stats/useStats';
import { getWeakQuestionIds } from '../stats/statsSelectors';
import DrillTimerBar from './drill/DrillTimerBar';
import CourseSelector from './drill/CourseSelector';
import OrderSelector from './drill/OrderSelector';
import RatingButtons from './drill/RatingButtons';
import TempoSelector from './drill/TempoSelector';
import styles from './DrillPage.module.css';

export default function DrillPage({ mode = 'all', questions, valid, statsRepository }: { mode?: DrillMode; questions: Question[]; valid: boolean; statsRepository?: StatsRepository }) {
  const { stats, record, saveFailed } = useStats(statsRepository);
  const [settings, setSettings] = useState<SessionSettings>({ course: 'mixed', order: 'sequential' });
  const questionsById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  // Only initialization and explicit RESET select a sequence. Rating changes
  // update Stats without removing IDs from the current session snapshot.
  const [state, dispatch] = useReducer(drillReducer, undefined, () => createInitialDrillState(
    mode === 'review' ? getWeakQuestionIds(stats, questions) : buildQuestionSequence(questions, settings),
  ));
  const total = getTotalQuestions(state);
  const [tempo, setTempo] = useState<Tempo>('normal');
  const [manualPauseKey, setManualPauseKey] = useState<string | null>(null);
  const title = mode === 'review' ? 'Review' : 'Drill';
  function changeSessionSettings(next: SessionSettings) {
    if (mode === 'review' || state.phase !== 'ready') return;
    const questionIds = buildQuestionSequence(questions, next);
    setSettings(next);
    dispatch({ type: 'RESET', questionIds });
  }
  function resetSession() {
    const questionIds = mode === 'review'
      ? getWeakQuestionIds(stats, questions)
      : buildQuestionSequence(questions, settings);
    dispatch({ type: 'RESET', questionIds });
  }
  const saveError = saveFailed ? <p role="alert">戦績を保存できませんでした。</p> : null;
  const glossary = useGlossary();
  const id = getCurrentQuestionId(state);
  const question = id === undefined ? undefined : questionsById.get(id);
  const active = valid && question !== undefined && (state.phase === 'question' || state.phase === 'answer');
  const durationMs = state.phase === 'question' || state.phase === 'answer'
    ? getPhaseDurationMs(tempo, state.phase, question?.timeWeight)
    : 0;
  const resetKey = `${state.currentIndex}:${id}:${state.phase}`;
  const manualPaused = manualPauseKey === resetKey;
  const glossaryOpen = glossary != null && glossary.selectedGlossaryId !== null;
  useEffect(() => setManualPauseKey(null), [resetKey]);
  // Rating buttons unmount on advance; move focus to the new question instead of dropping it to <body>.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (state.phase === 'question') headingRef.current?.focus();
  }, [state.phase, state.currentIndex]);
  const { remainingMs } = useDrillTimer({
    durationMs,
    enabled: active,
    paused: manualPaused || glossaryOpen,
    resetKey,
    onExpire: () => dispatch({ type: 'TIMER_EXPIRED' }),
  });

  if (!valid) {
    return <InvalidContentNotice title={title} action="開始" />;
  }

  if (state.phase === 'ready') {
    return (
      <>
        <h2>{title}</h2>
        {saveError}
        {mode !== 'review' && (
          <>
            <CourseSelector course={settings.course} onChange={(course) => changeSessionSettings({ ...settings, course })} />
            <OrderSelector order={settings.order} onChange={(order) => changeSessionSettings({ ...settings, order })} />
          </>
        )}
        <TempoSelector tempo={tempo} onChange={setTempo} />
        {mode === 'review' ? (
          total > 0 ? <p>弱点候補 {total}問を復習します。</p> : (
            <>
              <p>現在、復習対象の問題はありません。</p>
              <p>△ 怪しい または × 分からなかった と評価した問題がここに表示されます。</p>
            </>
          )
        ) : (
          <>
            <p role="status">対象: {total}問</p>
            {total === 0 && <p>出題できる問題がありません。</p>}
          </>
        )}
        <button className={styles.action} type="button" disabled={total === 0} onClick={() => dispatch({ type: 'START' })}>開始</button>
      </>
    );
  }

  if (state.phase === 'finished') {
    return (
      <section className={styles.finished}>
        <h2>{title} Complete</h2>
        {saveError}
        <p>{total} / {total} questions completed</p>
        <button className={styles.action} type="button" onClick={resetSession}>{mode === 'review' ? '弱点を再取得' : 'もう一度'}</button>
      </section>
    );
  }

  if (!question) {
    return (
      <>
        <h2>{title}</h2>
        <p role="alert">問題データを取得できません。</p>
        <button className={styles.action} type="button" onClick={resetSession}>最初に戻る</button>
      </>
    );
  }

  return (
    <>
      <h2>{title}</h2>
      {saveError}
      <p className={styles.progress} role="status">Question {getCurrentQuestionNumber(state)} / {total}</p>
      <DrillTimerBar
        remainingMs={remainingMs}
        durationMs={durationMs}
        manualPaused={manualPaused}
        glossaryOpen={glossaryOpen}
        onTogglePause={() => setManualPauseKey(manualPaused ? null : resetKey)}
      />
      <article data-question-id={question.id}>
        <h3 ref={headingRef} tabIndex={-1}>[{question.category}] {question.topic}</h3>
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
      {state.phase === 'answer' && (
        <RatingButtons onRate={(rating) => {
          record(question.id, rating);
          dispatch({ type: 'NEXT' });
        }} />
      )}
      {state.phase === 'question' ? (
        <button className={styles.action} type="button" onClick={() => dispatch({ type: 'REVEAL_ANSWER' })}>答えを見る</button>
      ) : (
        <button className={styles.action} type="button" onClick={() => dispatch({ type: 'NEXT' })}>{isLastQuestion(state) ? '完了' : '次へ'}</button>
      )}
    </>
  );
}
