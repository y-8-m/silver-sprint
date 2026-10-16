import styles from '../DrillPage.module.css';

type DrillTimerBarProps = {
  remainingMs: number;
  durationMs: number;
  manualPaused: boolean;
  overlayOpen: boolean;
};

const URGENT_SECONDS = 3;

export default function DrillTimerBar({ remainingMs, durationMs, manualPaused, overlayOpen }: DrillTimerBarProps) {
  const seconds = Math.ceil(remainingMs / 1000);
  return (
    <div className={`${styles.timer} ${seconds <= URGENT_SECONDS ? styles.urgent : ''}`}>
      <span className={styles.seconds}><span className={styles.secondsValue}>{seconds}</span>秒</span>
      <progress className={styles.bar} aria-label="残り時間" max={durationMs} value={remainingMs} />
      {(manualPaused || overlayOpen) && <span className={styles.paused}>一時停止中</span>}
    </div>
  );
}
