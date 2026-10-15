import type { ValidationResult } from '../data/validate';
import styles from './Pages.module.css';

type HomePageProps = { questionCount: number; glossaryCount: number; validation: ValidationResult };

export default function HomePage({ questionCount, glossaryCount, validation }: HomePageProps) {
  return (
    <>
      <h2>ホーム</h2>
      <p>問題数: {questionCount}</p>
      <p>用語数: {glossaryCount}</p>
      <p>教材データ: {validation.valid ? 'OK' : 'エラー'}</p>
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
