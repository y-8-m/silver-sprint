import styles from '../DrillPage.module.css';

type DrillTimerBarProps = {
  remainingMs: number;
  durationMs: number;
  manualPaused: boolean;
  glossaryOpen: boolean;
};

const URGENT_SECONDS = 3;

export default function DrillTimerBar({ remainingMs, durationMs, manualPaused, glossaryOpen }: DrillTimerBarProps) {
  const seconds = Math.ceil(remainingMs / 1000);
  return (
    <div className={`${styles.timer} ${seconds <= URGENT_SECONDS ? styles.urgent : ''}`}>
      <span className={styles.seconds}><span className={styles.secondsValue}>{seconds}</span>秒</span>
      <progress className={styles.bar} aria-label="残り時間" max={durationMs} value={remainingMs} />
      {(manualPaused || glossaryOpen) && <span className={styles.paused}>一時停止中</span>}
    </div>
  );
}
