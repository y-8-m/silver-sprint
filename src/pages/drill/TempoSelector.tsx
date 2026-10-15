import { TEMPO_CONFIG } from '../../drill/tempo';
import type { Tempo } from '../../drill/tempo';
import styles from '../DrillPage.module.css';

const TEMPO_LABELS = { slow: 'ゆっくり', normal: '標準', fast: '速い' } as const satisfies Record<Tempo, string>;

type TempoSelectorProps = { tempo: Tempo; onChange(tempo: Tempo): void };

export default function TempoSelector({ tempo, onChange }: TempoSelectorProps) {
  return (
    <fieldset className={styles.settings}>
      <legend>速度</legend>
      {(Object.keys(TEMPO_CONFIG) as Tempo[]).map((option) => (
        <label key={option}>
          <input type="radio" name="tempo" value={option} checked={tempo === option} onChange={() => onChange(option)} />
          {TEMPO_LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
}
