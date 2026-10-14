import QuestionPreview from '../components/QuestionPreview';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import { validateContent } from '../data/validate';
import GlossaryDetailDialog from '../glossary/GlossaryDetailDialog';
import GlossaryProvider from '../glossary/GlossaryProvider';
import styles from './App.module.css';

const validation = validateContent(questions, glossary);

export default function App() {
  return (
    <GlossaryProvider glossary={glossary}>
      <main className={styles.app}>
        <h1>Silver Sprint</h1>
        <p>Java Silver SE 17 Drill</p>
        <p>教材データとRendererの静的プレビュー</p>
        <p>Questions: {questions.length}</p>
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
        {validation.valid && questions.map((question) => (
          <QuestionPreview question={question} key={question.id} />
        ))}
      </main>
      <GlossaryDetailDialog />
    </GlossaryProvider>
  );
}
