import type { ComparisonBlock } from '../../data/types';
import InlineRenderer from '../InlineRenderer';
import styles from './Blocks.module.css';

export default function ComparisonBlockView({ block }: { block: ComparisonBlock }) {
  return (
    <div className={styles.tableScroll} role="region" aria-label="比較表" tabIndex={0}>
      <table className={styles.table}>
        <thead>
          <tr>
            {block.columns.map((column) => (
              <th scope="col" key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr className={row.highlight ? styles.highlight : undefined} key={row.id}>
              {block.columns.map((column) => (
                <td key={column.key}>
                  <InlineRenderer nodes={row.cells[column.key] ?? []} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
