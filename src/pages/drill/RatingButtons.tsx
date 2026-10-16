import { getRatingLabel, RATING_LABELS } from '../../stats/statsFormatting';
import type { Rating } from '../../stats/statsTypes';
import styles from '../DrillPage.module.css';

const RATING_CLASSES = {
  known: styles.rating_known,
  unsure: styles.rating_unsure,
  unknown: styles.rating_unknown,
} as const satisfies Record<Rating, string | undefined>;

export default function RatingButtons({ onRate }: { onRate(rating: Rating): void }) {
  return (
    <fieldset className={styles.ratings}>
      <legend>理解度</legend>
      {(Object.keys(RATING_LABELS) as Rating[]).map((rating) => (
        <button className={`${styles.rating} ${RATING_CLASSES[rating]}`} type="button" key={rating} onClick={() => onRate(rating)}>
          {getRatingLabel(rating)}
        </button>
      ))}
    </fieldset>
  );
}
