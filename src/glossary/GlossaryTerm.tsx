import { useId, useState } from 'react';
import type { GlossaryInline } from '../data/types';
import { useGlossary } from './GlossaryContext';
import GlossaryShortTooltip from './GlossaryShortTooltip';
import PlainInlineRenderer from '../components/PlainInlineRenderer';
import styles from './Glossary.module.css';

export default function GlossaryTerm({ node }: { node: GlossaryInline }) {
  const context = useGlossary();
  const entry = context?.getEntry(node.glossaryId);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const tooltipId = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const showShort = hovered || focused;

  if (!entry) return <PlainInlineRenderer nodes={[node]} />;

  return (
    <>
      <button
        type="button"
        ref={setAnchor}
        className={styles.term}
        data-glossary-id={node.glossaryId}
        aria-haspopup="dialog"
        aria-describedby={showShort ? tooltipId : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'touch') setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setHovered(false);
            setFocused(false);
          }
        }}
        onClick={() => {
          setHovered(false);
          setFocused(false);
          context?.openGlossary(node.glossaryId);
        }}
      >
        {node.text}
      </button>
      {showShort && anchor && (
        <GlossaryShortTooltip id={tooltipId} anchor={anchor} entry={entry} />
      )}
    </>
  );
}
