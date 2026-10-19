import type { Rating } from '../../stats/statsTypes';
import styles from '../DrillPage.module.css';
import DrillTimerBar from './DrillTimerBar';
import RatingButtons from './RatingButtons';

type DrillControllerProps = {
  answering: boolean;
  lastQuestion: boolean;
  current: number;
  total: number;
  remainingMs: number;
  durationMs: number;
  manualPaused: boolean;
  overlayOpen: boolean;
  onTogglePause(): void;
  onNext(): void;
  onRate(rating: Rating): void;
};

export default function DrillController({
  answering, lastQuestion, current, total, remainingMs, durationMs,
  manualPaused, overlayOpen, onTogglePause, onNext, onRate,
}: DrillControllerProps) {
  const nextLabel = !answering ? '答えを見る' : lastQuestion ? '評価せずに完了' : '評価せずに次へ';
  return (
    <section className={styles.controllerShell} aria-label="ドリル操作">
      <div className={styles.controllerScroll}>
        <div className={styles.controller}>
          <div className={styles.transport}>
            <button className={styles.playPause} type="button" aria-label={manualPaused ? '再開' : '一時停止'} onClick={onTogglePause}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {manualPaused ? <path d="m7 3 14 9-14 9Z" /> : <path d="M5 3h5v18H5zM14 3h5v18h-5z" />}
              </svg>
            </button>
            <button className={styles.next} type="button" aria-label={nextLabel} onClick={onNext}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="m3 4 12 8L3 20ZM17 4h4v16h-4Z" />
              </svg>
            </button>
            <p className={styles.progress} role="status">{current} / {total} 問</p>
          </div>
          <DrillTimerBar
            answering={answering}
            remainingMs={remainingMs}
            durationMs={durationMs}
            manualPaused={manualPaused}
            overlayOpen={overlayOpen}
          />
          <div className={styles.ratingSlot}>
            <RatingButtons onRate={onRate} reserved={!answering} />
          </div>
          <p className={styles.brand}>Silver Sprint</p>
        </div>
      </div>
    </section>
  );
}
