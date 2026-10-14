import type { ExplanationBlock } from '../../data/types';
import CodeBlockView from './CodeBlockView';
import ComparisonBlockView from './ComparisonBlockView';
import StepsBlockView from './StepsBlockView';
import TextBlockView from './TextBlockView';

export default function BlockRenderer({ block }: { block: ExplanationBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlockView block={block} />;
    case 'code':
      return <CodeBlockView block={block} />;
    case 'steps':
      return <StepsBlockView block={block} />;
    case 'comparison':
      return <ComparisonBlockView block={block} />;
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}
