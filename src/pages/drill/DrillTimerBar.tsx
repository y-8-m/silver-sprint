import styles from '../DrillPage.module.css';

type DrillTimerBarProps = {
  remainingMs: number;
  durationMs: number;
  manualPaused: boolean;
  glossaryOpen: boolean;
  onTogglePause(): void;
};

export default function DrillTimerBar({ remainingMs, durationMs, manualPaused, glossaryOpen, onTogglePause }: DrillTimerBarProps) {
  return (
    <div className={styles.timer}>
      <span>Time: {(remainingMs / 1000).toFixed(1)}s</span>
      <progress aria-label="残り時間" max={durationMs} value={remainingMs} />
      {(manualPaused || glossaryOpen) && <span>一時停止中</span>}
      <button className={styles.action} type="button" onClick={onTogglePause}>
        {manualPaused ? '再開' : '一時停止'}
      </button>
    </div>
  );
}
