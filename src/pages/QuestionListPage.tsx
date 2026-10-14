import { useState } from 'react';
import InvalidContentNotice from '../components/InvalidContentNotice';
import QuestionPreview from '../components/QuestionPreview';
import type { Question } from '../data/types';
import styles from './Pages.module.css';

const categories = [['A', '概念理解'], ['B', '実行順・状態遷移'], ['C', 'Java固有ルール'], ['D', 'API・語彙']] as const;

export default function QuestionListPage({ questions, valid }: { questions: Question[]; valid: boolean }) {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  if (!valid) {
    return <InvalidContentNotice title="Questions" action="表示" />;
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
      <h2>Questions</h2>
      <div className={styles.filters}>
        <label>Question category
          <select value={category} onChange={(event) => changeCategory(event.target.value)}>
            <option value="">All</option>
            {categories.map(([value, label]) => <option value={value} key={value}>{value} = {label}</option>)}
          </select>
        </label>
        <label>Topic
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">All</option>
            {topics.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <p role="status">{filtered.length} / {questions.length} questions</p>
      {filtered.length === 0 && <p className={styles.empty}>条件に一致する問題はありません。</p>}
      {filtered.map((question) => <QuestionPreview question={question} collapseAnswer key={question.id} />)}
    </>
  );
}
