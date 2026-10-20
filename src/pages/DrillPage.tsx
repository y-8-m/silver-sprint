import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutOutletContext } from '../app/layoutOutletContext';
import InvalidContentNotice from '../components/InvalidContentNotice';
import { AnswerAndExplanationSections, PromptSection } from '../components/QuestionSections';
import { CATEGORY_LABELS } from '../data/categoryLabels';
import type { Question } from '../data/types';
import { parseDrillLaunch } from '../drill/drillLaunch';
import { createInitialDrillState, drillReducer } from '../drill/drillReducer';
import type { DrillMode } from '../drill/drillTypes';
import { getCurrentQuestionId, getCurrentQuestionNumber, getTotalQuestions, isLastQuestion } from '../drill/drillSelectors';
import { buildQuestionSequence } from '../drill/sessionSequence';
import type { SessionSettings } from '../drill/sessionSequence';
import { getPhaseDurationMs } from '../drill/tempo';
import type { Tempo } from '../drill/tempo';
import { useDrillKeys } from '../drill/useDrillKeys';
import { useDrillTimer } from '../drill/useDrillTimer';
import { useGlossary } from '../glossary/GlossaryContext';
import HelpButton from '../help/HelpButton';
import { useHelp } from '../help/HelpContext';
import type { Rating } from '../stats/statsTypes';
import type { StatsRepository } from '../stats/statsRepository';
import { useStats } from '../stats/useStats';
import { getWeakQuestionIds } from '../stats/statsSelectors';
import DrillController from './drill/DrillController';
import CourseSelector from './drill/CourseSelector';
import OrderSelector from './drill/OrderSelector';
import QuestionCountSelector from './drill/QuestionCountSelector';
import TempoSelector from './drill/TempoSelector';
import styles from './DrillPage.module.css';

export default function DrillPage({ mode = 'all', questions, valid, statsRepository }: { mode?: DrillMode; questions: Question[]; valid: boolean; statsRepository?: StatsRepository }) {
  const { stats, record, saveFailed } = useStats(statsRepository);
  const navigate = useNavigate();
  // A launch from Home (?course=...) fixes the settings and starts at once; read once on mount.
  const [searchParams] = useSearchParams();
  const [launch] = useState(() => (mode === 'all' ? parseDrillLaunch(searchParams) : null));
  const [settings, setSettings] = useState<SessionSettings>(launch?.settings ?? { course: 'mixed', order: 'sequential', questionCount: 'all' });
  const questionsById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  // Only initialization and explicit RESET select a sequence. Rating changes
  // update Stats without removing IDs from the current session snapshot.
  const [state, dispatch] = useReducer(drillReducer, undefined, () => {
    const ready = createInitialDrillState(
      mode === 'review' ? getWeakQuestionIds(stats, questions) : buildQuestionSequence(questions, settings),
    );
    return launch ? drillReducer(ready, { type: 'START' }) : ready;
  });
  const total = getTotalQuestions(state);
  const [tempo, setTempo] = useState<Tempo>(launch?.tempo ?? 'normal');
  const [manualPauseKey, setManualPauseKey] = useState<string | null>(null);
  const title = mode === 'review' ? '復習' : 'ドリル';
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
  function exitDrill() {
    if (window.confirm('ドリルを終了しますか？')) navigate('/');
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
  const helpOpen = useHelp()?.open ?? false;
  const overlayOpen = glossaryOpen || helpOpen;
  useEffect(() => setManualPauseKey(null), [resetKey]);
  // On advance, move focus to the new question when the rating controls become unavailable.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (state.phase === 'question') headingRef.current?.focus();
  }, [state.phase, state.currentIndex]);
  // On a phone the answer starts below the fold; bring it up when revealed.
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.phase === 'answer') answerRef.current?.scrollIntoView?.({ block: 'start' });
  }, [state.phase, state.currentIndex]);
  // An active session takes the whole screen: the app header and navigation step aside.
  const layout = useOutletContext<LayoutOutletContext | undefined>();
  const setImmersive = layout?.setImmersive;
  const inSession = valid && (state.phase === 'question' || state.phase === 'answer');
  useEffect(() => {
    setImmersive?.(inSession);
    return () => setImmersive?.(false);
  }, [inSession, setImmersive]);
  function rateCurrent(rating: Rating) {
    if (state.phase !== 'answer' || question === undefined) return;
    record(question.id, rating);
    dispatch({ type: 'NEXT' });
  }
  useDrillKeys(active && !overlayOpen, state.phase === 'answer', {
    onTogglePause: () => setManualPauseKey(manualPaused ? null : resetKey),
    onPrimary: () => dispatch({ type: state.phase === 'question' ? 'REVEAL_ANSWER' : 'NEXT' }),
    onRate: rateCurrent,
  });
  const { remainingMs } = useDrillTimer({
    durationMs,
    enabled: active,
    paused: manualPaused || overlayOpen,
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
            <QuestionCountSelector questionCount={settings.questionCount} onChange={(questionCount) => changeSessionSettings({ ...settings, questionCount })} />
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
        <h2>{title}完了</h2>
        {saveError}
        <p>{total} / {total} 問完了</p>
        <button className={styles.action} type="button" onClick={resetSession}>もう一度</button>
        <Link className={styles.homeLink} to="/">ホームへ</Link>
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
    <div className={styles.session}>
      <h2 className={styles.srOnly}>{title}</h2>
      <div className={styles.header}>
        <button className={styles.quiet} type="button" onClick={exitDrill}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 4 6 10l6 6" /></svg>
          終了
        </button>
        <HelpButton variant="icon" className={styles.helpButton} />
      </div>
      <div className={styles.scrollArea} role="region" aria-label="問題・解説" tabIndex={0}>
        {saveError}
        <article data-question-id={question.id}>
          <h3 className={styles.meta} ref={headingRef} tabIndex={-1}>
            <b>{question.category}</b> {CATEGORY_LABELS[question.category]}　/　{question.topic}
          </h3>
          <PromptSection question={question} headingLevel={4} className={styles.prompt} />
          {state.phase === 'answer' && (
            <div ref={answerRef} className={styles.answerArea}>
              <AnswerAndExplanationSections
                question={question}
                headingLevel={4}
                answerClassName={styles.answer}
                explanationClassName={styles.explanation}
              />
            </div>
          )}
        </article>
      </div>
      <DrillController
        answering={state.phase === 'answer'}
        lastQuestion={isLastQuestion(state)}
        current={getCurrentQuestionNumber(state)}
        total={total}
        remainingMs={remainingMs}
        durationMs={durationMs}
        manualPaused={manualPaused}
        overlayOpen={overlayOpen}
        onTogglePause={() => setManualPauseKey(manualPaused ? null : resetKey)}
        onNext={() => dispatch({ type: state.phase === 'question' ? 'REVEAL_ANSWER' : 'NEXT' })}
        onRate={rateCurrent}
      />
    </div>
  );
}
