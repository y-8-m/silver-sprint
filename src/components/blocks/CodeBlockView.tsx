import type { CodeBlock } from '../../data/types';
import styles from './Blocks.module.css';

export default function CodeBlockView({ block }: { block: CodeBlock }) {
  return (
    <pre className={styles.code} tabIndex={0}>
      <code data-language={block.language}>{block.code}</code>
    </pre>
  );
}
