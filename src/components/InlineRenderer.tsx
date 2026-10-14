import type { InlineNode } from '../data/types';
import styles from './InlineRenderer.module.css';

type InlineRendererProps = {
  nodes: InlineNode[];
};

export default function InlineRenderer({ nodes }: InlineRendererProps) {
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
              <span
                className={styles.glossary}
                data-glossary-id={node.glossaryId}
                key={index}
              >
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
