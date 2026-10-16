import { useHelp } from './HelpContext';
import styles from './Help.module.css';

export default function HelpButton({ className }: { className?: string }) {
  const help = useHelp();
  return (
    <button
      className={`${styles.button} ${className ?? ''}`}
      type="button"
      aria-label="ヘルプ"
      aria-haspopup="dialog"
      onClick={() => help?.openHelp()}
    >
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <path d="M7.7 7.8a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.8-1.1 1.6M10 14v.4" />
      </svg>
    </button>
  );
}
