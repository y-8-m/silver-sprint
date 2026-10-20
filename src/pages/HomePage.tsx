import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_LABELS } from '../data/categoryLabels';
import type { Category, Question } from '../data/types';
import type { ValidationResult } from '../data/validate';
import { buildDrillPath, loadDrillPreferences, saveDrillPreferences } from '../drill/drillLaunch';
import type { DrillPreferences } from '../drill/drillLaunch';
import type { Course } from '../drill/sessionSequence';
import type { StatsRepository } from '../stats/statsRepository';
import { getWeakQuestionIds } from '../stats/statsSelectors';
import { useStats } from '../stats/useStats';
import OrderSelector from './drill/OrderSelector';
import QuestionCountSelector from './drill/QuestionCountSelector';
import TempoSelector from './drill/TempoSelector';
import styles from './HomePage.module.css';
import pageStyles from './Pages.module.css';

type HomePageProps = { questions: Question[]; validation: ValidationResult; statsRepository?: StatsRepository };

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const ORDER_SUMMARY = { sequential: '順番', random: 'ランダム' } as const;
const TEMPO_SUMMARY = { slow: 'ゆっくり', normal: '標準', fast: '速い' } as const;

export default function HomePage({ questions, validation, statsRepository }: HomePageProps) {
  const { stats } = useStats(statsRepository);
  const [preferences, setPreferences] = useState<DrillPreferences>(() => loadDrillPreferences());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsId = useId();

  function changePreferences(next: DrillPreferences) {
    setPreferences(next);
    saveDrillPreferences(next);
  }

  const courses: { course: Course; key: string; label: string; count: number }[] = [
    { course: 'mixed', key: 'mixed', label: '全カテゴリ', count: questions.length },
    ...CATEGORIES.map((category) => ({
      course: category,
      key: category,
      label: CATEGORY_LABELS[category],
      count: questions.filter((question) => question.category === category).length,
    })),
  ];
  const weakCount = getWeakQuestionIds(stats, questions).length;

  return (
    <>
      {validation.valid && (
        <section aria-labelledby="home-drill" className={styles.primarySection}>
          <div className={styles.sectionHeader}>
            <h2 id="home-drill" className={styles.heading}>ドリル</h2>
            <button
              className={styles.settingsToggle}
              type="button"
              aria-expanded={settingsOpen}
              aria-controls={settingsId}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              出題設定　{ORDER_SUMMARY[preferences.order]} · {TEMPO_SUMMARY[preferences.tempo]} · {preferences.questionCount === 'all' ? '全問' : `${preferences.questionCount}問`}
            </button>
          </div>
          <div id={settingsId} hidden={!settingsOpen}>
            <QuestionCountSelector questionCount={preferences.questionCount} onChange={(questionCount) => changePreferences({ ...preferences, questionCount })} />
            <OrderSelector order={preferences.order} onChange={(order) => changePreferences({ ...preferences, order })} />
            <TempoSelector tempo={preferences.tempo} onChange={(tempo) => changePreferences({ ...preferences, tempo })} />
          </div>
          <ul className={`${styles.rows} ${styles.courses}`}>
            {courses.map(({ course, key, label, count }) => (
              <li key={key}>
                <Link className={`${styles.row} ${styles.courseRow}`} to={buildDrillPath(course, preferences)}>
                  <span className={styles.courseLabel}>
                    {course !== 'mixed' && <span className={styles.key}>{course}</span>}
                    <span className={styles.courseName}>{label}</span>
                  </span>
                  <span className={styles.meta}>
                    {preferences.questionCount !== 'all' && preferences.questionCount < count ? `${preferences.questionCount} / ` : ''}{count} 問
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="home-review" className={styles.primarySection}>
        <div className={styles.sectionHeader}>
          <h2 id="home-review" className={styles.heading}>復習</h2>
        </div>
        <ul className={styles.rows}>
          <li>
            <Link className={styles.row} to="/review">
              <span>△ 怪しい／× 分からなかった の問題</span>
              <span className={styles.meta}>{weakCount} 問</span>
            </Link>
          </li>
        </ul>
      </section>

      <div className={styles.references}>
        <section aria-labelledby="home-lookup">
          <div className={styles.sectionHeader}>
            <h2 id="home-lookup" className={styles.heading}>調べる</h2>
          </div>
          <ul className={styles.rows}>
            <li><Link className={styles.row} to="/questions">問題一覧</Link></li>
            <li><Link className={styles.row} to="/glossary">用語集</Link></li>
          </ul>
        </section>
        <section aria-labelledby="home-reflect">
          <div className={styles.sectionHeader}>
            <h2 id="home-reflect" className={styles.heading}>振り返る</h2>
          </div>
          <ul className={styles.rows}>
            <li><Link className={styles.row} to="/stats">戦績</Link></li>
          </ul>
        </section>
      </div>

      <p className={styles.status}>
        {validation.valid ? '教材データ：問題なし' : '教材データ：エラー'}
      </p>
      {!validation.valid && (
        <ul className={pageStyles.issues}>
          {validation.issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`}><code>{issue.path}</code>: {issue.message}</li>
          ))}
        </ul>
      )}
    </>
  );
}
