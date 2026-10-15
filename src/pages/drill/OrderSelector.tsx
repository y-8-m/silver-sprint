import type { QuestionOrder } from '../../drill/sessionSequence';
import styles from '../DrillPage.module.css';

const ORDER_LABELS = { sequential: '順番', random: 'ランダム' } as const satisfies Record<QuestionOrder, string>;

type OrderSelectorProps = { order: QuestionOrder; onChange(order: QuestionOrder): void };

export default function OrderSelector({ order, onChange }: OrderSelectorProps) {
  return (
    <fieldset className={styles.settings}>
      <legend>出題順</legend>
      {(Object.keys(ORDER_LABELS) as QuestionOrder[]).map((option) => (
        <label key={option}>
          <input type="radio" name="order" value={option} checked={order === option} onChange={() => onChange(option)} />
          {ORDER_LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
}
