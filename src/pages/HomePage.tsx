import type { ValidationResult } from '../data/validate';
import styles from './Pages.module.css';

type HomePageProps = { questionCount: number; glossaryCount: number; validation: ValidationResult };

export default function HomePage({ questionCount, glossaryCount, validation }: HomePageProps) {
  return (
    <>
      <h2>Home</h2>
      <p>Questions: {questionCount}</p>
      <p>Glossary entries: {glossaryCount}</p>
      <p>Data validation: {validation.valid ? 'OK' : 'ERROR'}</p>
      {!validation.valid && (
        <ul className={styles.issues}>
          {validation.issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`}><code>{issue.path}</code>: {issue.message}</li>
          ))}
        </ul>
      )}
    </>
  );
}
