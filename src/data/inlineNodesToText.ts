import type { InlineNode } from './types';

export function inlineNodesToText(nodes: InlineNode[]): string {
  return nodes.map((node) => node.text).join('');
}
