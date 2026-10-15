import { useState } from 'react';
import InvalidContentNotice from '../components/InvalidContentNotice';
import QuestionPreview from '../components/QuestionPreview';
import { CATEGORY_LABELS } from '../data/categoryLabels';
import type { Question } from '../data/types';
import styles from './Pages.module.css';

export default function QuestionListPage({ questions, valid }: { questions: Question[]; valid: boolean }) {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  if (!valid) {
    return <InvalidContentNotice title="問題一覧" action="表示" />;
  }
  // Drop a topic that cannot match the newly chosen category instead of silently emptying the list.
  const changeCategory = (next: string) => {
    setCategory(next);
    if (topic && !questions.some((question) => (!next || question.category === next) && question.topic === topic)) {
      setTopic('');
    }
  };
  const topics = [...new Set(questions.map((question) => question.topic))];
  const filtered = questions.filter((question) => (
    (!category || question.category === category) && (!topic || question.topic === topic)
  ));
  return (
    <>
      <h2>問題一覧</h2>
      <div className={styles.filters}>
        <label>カテゴリ
          <select value={category} onChange={(event) => changeCategory(event.target.value)}>
            <option value="">すべて</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option value={value} key={value}>{value} = {label}</option>)}
          </select>
        </label>
        <label>トピック
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">すべて</option>
            {topics.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <p role="status">{filtered.length} / {questions.length} 問</p>
      {filtered.length === 0 && <p className={styles.empty}>条件に一致する問題はありません。</p>}
      {filtered.map((question) => <QuestionPreview question={question} collapseAnswer key={question.id} />)}
    </>
  );
}
