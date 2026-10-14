import type { InlineNode } from '../data/types';
import styles from '../components/InlineRenderer.module.css';

export default function PlainInlineRenderer({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case 'text':
            return node.text;
          case 'code':
            return <code className={styles.code} key={index}>{node.text}</code>;
          case 'glossary':
            return (
              <span className={styles.glossary} data-glossary-id={node.glossaryId} key={index}>
                {node.text}
              </span>
            );
          default: {
            const unhandled: never = node;
            return unhandled;
          }
        }
      })}
    </>
  );
}
