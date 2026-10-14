import type { InlineNode } from '../data/types';
import GlossaryTerm from '../glossary/GlossaryTerm';
import PlainInlineRenderer from './PlainInlineRenderer';

type InlineRendererProps = {
  nodes: InlineNode[];
};

export default function InlineRenderer({ nodes }: InlineRendererProps) {
  return (
    <>
      {nodes.map((node, index) => (
        node.type === 'glossary'
          ? <GlossaryTerm node={node} key={index} />
          : <PlainInlineRenderer nodes={[node]} key={index} />
      ))}
    </>
  );
}
