import { useEffect, useId, useRef } from 'react';
import { useHelp } from './HelpContext';
import styles from './Help.module.css';

const KEYS = [
  { keys: ['Space'], action: '一時停止／再開' },
  { keys: ['Enter'], action: '答えを見る／次へ（評価せずに進む）' },
  { keys: ['1', '2', '3'], action: '分かった／怪しい／分からなかった（評価して次へ）' },
  { keys: ['Esc'], action: '使い方や用語の詳細を閉じる' },
] as const;

export default function HelpDialog() {
  const help = useHelp();
  const open = help?.open ?? false;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  // The dialog exists only while open, so other screens never see a second <dialog>.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    titleRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        help?.closeHelp();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) help?.closeHelp();
      }}
    >
      <h2 id={titleId} ref={titleRef} tabIndex={-1}>使い方</h2>
      <h3>キー操作（ドリル中）</h3>
      <dl className={styles.keys}>
        {KEYS.map(({ keys, action }) => (
          <div key={action}>
            <dt>{keys.map((key) => <kbd key={key}>{key}</kbd>)}</dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.note}>
        ボタンにフォーカスがあるときは、Space と Enter はそのボタンの操作になります。
        使い方や用語を開いている間は、残り時間が止まります。
      </p>
      <button className={styles.close} type="button" onClick={() => help?.closeHelp()}>閉じる</button>
    </dialog>
  );
}
