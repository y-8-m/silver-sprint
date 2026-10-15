import type { Category } from './types';

export const CATEGORY_LABELS = {
  A: '概念理解',
  B: '実行順・状態遷移',
  C: 'Java固有ルール',
  D: 'API・語彙',
} as const satisfies Record<Category, string>;
