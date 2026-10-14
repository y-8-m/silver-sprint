import type { Rating } from './statsTypes';

export const RATING_LABELS = {
  known: '○ 分かった',
  unsure: '△ 怪しい',
  unknown: '× 分からなかった',
} as const satisfies Record<Rating, string>;

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

const answeredAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function formatAnsweredAt(answeredAt: string): string {
  return answeredAtFormatter.format(new Date(answeredAt));
}
