import type { StepsBlock } from '../../data/types';
import InlineRenderer from '../InlineRenderer';
import styles from './Blocks.module.css';

export default function StepsBlockView({ block }: { block: StepsBlock }) {
  return (
    <ol className={styles.steps}>
      {block.items.map((item, index) => (
        <li key={index}><InlineRenderer nodes={item} /></li>
      ))}
    </ol>
  );
}
