import { QUESTION_COUNTS } from '../../drill/sessionSequence';
import type { QuestionCount } from '../../drill/sessionSequence';
import styles from '../DrillPage.module.css';

type QuestionCountSelectorProps = { questionCount: QuestionCount; onChange(questionCount: QuestionCount): void };

export default function QuestionCountSelector({ questionCount, onChange }: QuestionCountSelectorProps) {
  return (
    <fieldset className={styles.settings}>
      <legend>出題数</legend>
      {QUESTION_COUNTS.map((option) => (
        <label key={option}>
          <input type="radio" name="questionCount" value={option} checked={questionCount === option} onChange={() => onChange(option)} />
          {option === 'all' ? '全問' : `${option}問`}
        </label>
      ))}
    </fieldset>
  );
}
