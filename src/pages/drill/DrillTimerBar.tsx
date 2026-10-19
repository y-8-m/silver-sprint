import styles from '../DrillPage.module.css';

type DrillTimerBarProps = {
  remainingMs: number;
  durationMs: number;
  manualPaused: boolean;
  overlayOpen: boolean;
  answering: boolean;
};

const URGENT_SECONDS = 3;

export default function DrillTimerBar({ remainingMs, durationMs, manualPaused, overlayOpen, answering }: DrillTimerBarProps) {
  const seconds = Math.ceil(remainingMs / 1000);
  return (
    <div className={`${styles.timer} ${seconds <= URGENT_SECONDS ? styles.urgent : ''}`}>
      <progress className={styles.bar} aria-label="残り時間" max={durationMs} value={remainingMs} />
      <div className={styles.timeLabels}>
        <span>{answering ? '解説表示中' : '問題表示中'}</span>
        <span className={styles.pauseStatus}>
          {(manualPaused || overlayOpen) && <span className={styles.paused}>一時停止中</span>}
        </span>
        <span className={styles.seconds}>残り<span className={styles.secondsValue}>{String(seconds).padStart(2, '0')}</span>秒</span>
      </div>
    </div>
  );
}
