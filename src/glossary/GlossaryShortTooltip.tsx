import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GlossaryEntry } from '../data/types';
import PlainInlineRenderer from './PlainInlineRenderer';
import styles from './Glossary.module.css';

type GlossaryShortTooltipProps = {
  anchor: HTMLElement;
  entry: GlossaryEntry;
  id: string;
};

export default function GlossaryShortTooltip({ anchor, entry, id }: GlossaryShortTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const popup = ref.current;
      if (!popup) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 8;
      const below = rect.bottom + margin;
      setPosition({
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - popup.offsetWidth - margin)),
        top: below + popup.offsetHeight <= window.innerHeight - margin
          ? below
          : Math.max(margin, rect.top - popup.offsetHeight - margin),
      });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor, entry]);

  // A portal avoids clipping by tables; stay in the dialog's top layer when inside it.
  return createPortal(
    <span
      id={id}
      role="tooltip"
      ref={ref}
      className={styles.tooltip}
      style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}
    >
      <strong>{entry.term}</strong>
      <br />
      <PlainInlineRenderer nodes={entry.short} />
    </span>,
    anchor.closest('dialog') ?? document.body,
  );
}
