import type { TextBlock } from '../../data/types';
import InlineRenderer from '../InlineRenderer';
import styles from './Blocks.module.css';

export default function TextBlockView({ block }: { block: TextBlock }) {
  return <p className={styles.text}><InlineRenderer nodes={block.content} /></p>;
}
