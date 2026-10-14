import { useState } from 'react';
import { Link } from 'react-router-dom';
import QuestionPreview from '../components/QuestionPreview';
import type { Question } from '../data/types';
import styles from './Pages.module.css';

const categories = [['A', '概念理解'], ['B', '実行順・状態遷移'], ['C', 'Java固有ルール'], ['D', 'API・語彙']] as const;

export default function QuestionListPage({ questions, valid }: { questions: Question[]; valid: boolean }) {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  if (!valid) {
    return <><h2>Questions</h2><p role="alert">教材データにエラーがあるため表示できません。<Link to="/">Home</Link>で検証結果を確認してください。</p></>;
  }
  const topics = [...new Set(questions.map((question) => question.topic))];
  const filtered = questions.filter((question) => (
    (!category || question.category === category) && (!topic || question.topic === topic)
  ));
  return (
    <>
      <h2>Questions</h2>
      <div className={styles.filters}>
        <label>Question category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
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
