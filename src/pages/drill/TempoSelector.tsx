import { TEMPO_CONFIG } from '../../drill/tempo';
import type { Tempo } from '../../drill/tempo';
import styles from '../DrillPage.module.css';

const TEMPO_LABELS = { slow: 'Slow', normal: 'Normal', fast: 'Fast' } as const satisfies Record<Tempo, string>;

type TempoSelectorProps = { tempo: Tempo; onChange(tempo: Tempo): void };

export default function TempoSelector({ tempo, onChange }: TempoSelectorProps) {
  return (
    <fieldset className={styles.settings}>
      <legend>Tempo</legend>
      {(Object.keys(TEMPO_CONFIG) as Tempo[]).map((option) => (
        <label key={option}>
          <input type="radio" name="tempo" value={option} checked={tempo === option} onChange={() => onChange(option)} />
          {TEMPO_LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
}
