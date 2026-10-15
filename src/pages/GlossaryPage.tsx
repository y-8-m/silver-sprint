import { useState } from 'react';
import InvalidContentNotice from '../components/InvalidContentNotice';
import { inlineNodesToText } from '../data/inlineNodesToText';
import type { GlossaryDictionary } from '../data/types';
import { useGlossary } from '../glossary/GlossaryContext';
import PlainInlineRenderer from '../components/PlainInlineRenderer';
import styles from './Pages.module.css';

export default function GlossaryPage({ glossary, valid }: { glossary: GlossaryDictionary; valid: boolean }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const context = useGlossary();
  if (!valid) {
    return <InvalidContentNotice title="用語集" action="表示" />;
  }
  const entries = Object.entries(glossary);
  const categories = [...new Set(entries.map(([, entry]) => entry.category))].sort((a, b) => a.localeCompare(b, 'ja'));
  const query = search.trim().toLowerCase();
  const filtered = entries.filter(([, entry]) => (
    (!category || entry.category === category) &&
    [entry.term, entry.category, inlineNodesToText(entry.short)].some((value) => value.toLowerCase().includes(query))
  )).sort(([idA, a], [idB, b]) => a.term.localeCompare(b.term, 'ja') || idA.localeCompare(idB, 'ja'));
  return (
    <>
      <h2>用語集</h2>
      <div className={styles.filters}>
        <label>用語検索
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>カテゴリ
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">すべて</option>
            {categories.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <p role="status">{filtered.length} / {entries.length} 語</p>
      {filtered.length === 0 && <p className={styles.empty}>条件に一致する用語はありません。</p>}
      {filtered.map(([id, entry]) => (
        <article className={styles.glossaryCard} data-glossary-entry-id={id} key={id}>
          <h3>{entry.term}</h3>
          <p>カテゴリ: {entry.category}</p>
          <p><PlainInlineRenderer nodes={entry.short} /></p>
          <button type="button" aria-label={`${entry.term}の詳細`} disabled={!context} onClick={() => context?.openGlossary(id)}>詳細</button>
        </article>
      ))}
    </>
  );
}
