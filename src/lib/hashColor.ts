// 기업명 → 고정 컬러 (아바타·캘린더 도트 공용)
const PALETTE = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
  "#06B6D4", "#6366F1", "#F97316", "#14B8A6", "#A855F7",
];

export function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
