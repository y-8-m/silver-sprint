import InvalidContentNotice from '../components/InvalidContentNotice';
import { Link } from 'react-router-dom';
import type { Question } from '../data/types';
import { formatAnsweredAt, getRatingLabel } from '../stats/statsFormatting';
import type { StatsRepository } from '../stats/statsRepository';
import { getQuestionStatsViews, getRecentQuestionStats, getStatsSummary, getWeakQuestionStats } from '../stats/statsSelectors';
import { useStats } from '../stats/useStats';
import styles from './StatsPage.module.css';

export default function StatsPage({ questions, valid, statsRepository }: { questions: Question[]; valid: boolean; statsRepository?: StatsRepository }) {
  const { stats, clear, clearFailed } = useStats(statsRepository);
  if (!valid) return <InvalidContentNotice title="戦績" action="表示" />;

  const summary = getStatsSummary(stats, questions);
  const views = getQuestionStatsViews(stats, questions);
  const weak = getWeakQuestionStats(stats, questions);
  const recent = getRecentQuestionStats(stats, questions);

  return (
    <>
      <h2>戦績</h2>
      <section className={styles.section} aria-labelledby="stats-summary">
        <h3 id="stats-summary">概要</h3>
        {summary.ratedQuestionCount === 0 && <p>まだ評価記録がありません。</p>}
        <dl className={styles.summary}>
          <div><dt>評価済み問題</dt><dd>{summary.ratedQuestionCount} / {questions.length}</dd></div>
          <div><dt>未評価問題</dt><dd>{summary.unratedQuestionCount}</dd></div>
          <div><dt>評価回数</dt><dd>{summary.totalRatings}</dd></div>
          <div><dt>{getRatingLabel('known')}</dt><dd>{summary.knownCount}</dd></div>
          <div><dt>{getRatingLabel('unsure')}</dt><dd>{summary.unsureCount}</dd></div>
          <div><dt>{getRatingLabel('unknown')}</dt><dd>{summary.unknownCount}</dd></div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="stats-weak">
        <h3 id="stats-weak">弱点問題</h3>
        {weak.length > 0 && <p><Link to="/review">弱点を復習</Link></p>}
        {weak.length === 0 ? <p>弱点候補はありません。</p> : (
          <ul className={styles.list}>
            {weak.map((view) => (
              <li key={view.questionId}>[{view.category}] {view.topic}<p>最後の評価: {getRatingLabel(view.stats.lastRating)}</p></li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="stats-recent">
        <h3 id="stats-recent">最近の評価</h3>
        <p>問題ごとの最終評価（新しい順、最大5件）・日時は日本時間</p>
        {recent.length === 0 ? <p>最近の評価はありません。</p> : (
          <ol className={styles.list}>
            {recent.map((view) => (
              <li key={view.questionId}>
                [{view.category}] {view.topic}
                <p>{getRatingLabel(view.stats.lastRating)} · <time dateTime={view.stats.lastAnsweredAt}>{formatAnsweredAt(view.stats.lastAnsweredAt)}</time></p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={styles.section} aria-labelledby="stats-questions">
        <h3 id="stats-questions">問題別戦績</h3>
        <div className={styles.tableScroll} role="region" aria-label="問題別戦績の横スクロール" tabIndex={0}>
          <table>
            <caption>問題別戦績（教材順）</caption>
            <thead><tr>
              <th scope="col">カテゴリ</th><th scope="col">トピック</th>
              <th scope="col">{getRatingLabel('known')}</th><th scope="col">{getRatingLabel('unsure')}</th><th scope="col">{getRatingLabel('unknown')}</th>
              <th scope="col">最後の評価</th><th scope="col">最終評価日時（日本時間）</th>
            </tr></thead>
            <tbody>
              {views.map((view) => (
                <tr key={view.questionId}>
                  <td>{view.category}</td><th scope="row">{view.topic}</th>
                  <td>{view.stats?.knownCount ?? 0}</td><td>{view.stats?.unsureCount ?? 0}</td><td>{view.stats?.unknownCount ?? 0}</td>
                  <td>{view.stats ? getRatingLabel(view.stats.lastRating) : '評価なし'}</td>
                  <td>{view.stats ? <time dateTime={view.stats.lastAnsweredAt}>{formatAnsweredAt(view.stats.lastAnsweredAt)}</time> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-label="戦績の管理">
        <button className={styles.clear} type="button" onClick={() => {
          if (window.confirm('戦績をすべて削除しますか？')) clear();
        }}>戦績をクリア</button>
        {clearFailed && <p role="alert">一部の保存データを削除できなかった可能性があります。画面上の記録は空にしましたが、再読み込みすると保存済みの記録が戻る可能性があります。</p>}
      </section>
    </>
  );
}
