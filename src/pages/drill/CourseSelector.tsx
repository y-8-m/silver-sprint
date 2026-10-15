import { CATEGORY_LABELS } from '../../data/categoryLabels';
import type { Course } from '../../drill/sessionSequence';
import styles from '../DrillPage.module.css';

const COURSES: readonly Course[] = ['A', 'B', 'C', 'D', 'mixed'];

type CourseSelectorProps = { course: Course; onChange(course: Course): void };

export default function CourseSelector({ course, onChange }: CourseSelectorProps) {
  return (
    <fieldset className={styles.settings}>
      <legend>コース</legend>
      {COURSES.map((option) => (
        <label key={option}>
          <input type="radio" name="course" value={option} checked={course === option} onChange={() => onChange(option)} />
          {option === 'mixed' ? '全カテゴリ' : `${option} ${CATEGORY_LABELS[option]}`}
        </label>
      ))}
    </fieldset>
  );
}
