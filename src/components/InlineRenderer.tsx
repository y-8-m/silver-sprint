import type { InlineNode } from '../data/types';
import GlossaryTerm from '../glossary/GlossaryTerm';
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
            return <GlossaryTerm node={node} key={index} />;
          default: {
            const unhandled: never = node;
            return unhandled;
          }
        }
      })}
    </>
  );
}
