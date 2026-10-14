import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import { validateContent } from '../data/validate';
import styles from './App.module.css';

const validation = validateContent(questions, glossary);

export default function App() {
  return (
    <main className={styles.app}>
      <h1>Silver Sprint</h1>
      <p>Java Silver SE 17 Drill</p>
      <p>Sample questions: {questions.length}</p>
      <p>Glossary entries: {Object.keys(glossary).length}</p>
      <p>Data validation: {validation.valid ? 'OK' : 'ERROR'}</p>
      {!validation.valid && (
        <ul className={styles.issues}>
          {validation.issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`}>
              <code>{issue.path}</code>: {issue.message}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
