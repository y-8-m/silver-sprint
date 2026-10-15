import { useEffect, useId, useRef } from 'react';
import BlockRenderer from '../components/blocks/BlockRenderer';
import { useGlossary } from './GlossaryContext';
import PlainInlineRenderer from '../components/PlainInlineRenderer';
import styles from './Glossary.module.css';

export default function GlossaryDetailDialog() {
  const context = useGlossary();
  const selectedId = context?.selectedGlossaryId ?? null;
  const entry = selectedId !== null ? context?.getEntry(selectedId) : undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const shortId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (entry) {
      if (!dialog.open) dialog.showModal();
      titleRef.current?.focus();
      dialog.scrollTop = 0;
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selectedId, entry]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={shortId}
      onCancel={(event) => {
        event.preventDefault();
        context?.closeGlossary();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) context?.closeGlossary();
      }}
    >
      {entry && (
        <>
          <h2 id={titleId} ref={titleRef} tabIndex={-1}>{entry.term}</h2>
          <p>カテゴリ: {entry.category}</p>
          <p id={shortId}><PlainInlineRenderer nodes={entry.short} /></p>
          {entry.detail?.map((block, index) => <BlockRenderer block={block} key={index} />)}
          {!!entry.related?.length && (
            <section>
              <h3>関連用語</h3>
              <ul className={styles.related}>
                {entry.related.map((id) => {
                  const related = context?.getEntry(id);
                  return related ? (
                    <li key={id}>
                      <button type="button" onClick={() => context?.openGlossary(id)}>{related.term}</button>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          )}
          <button className={styles.close} type="button" onClick={() => context?.closeGlossary()}>閉じる</button>
        </>
      )}
    </dialog>
  );
}
