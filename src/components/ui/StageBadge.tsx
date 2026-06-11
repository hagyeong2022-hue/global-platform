// 투자단계 배지 — 기획서 §4-3 컬러 시스템 (전 화면 공통)
const STAGE_COLORS: { match: (s: string) => boolean; color: string; label?: string }[] = [
  { match: (s) => s.includes("예비") || /^seed$/i.test(s), color: "#64748B" },
  { match: (s) => /pre[\s-]?a/i.test(s), color: "#0EA5E9" },
  { match: (s) => /series\s?a|시리즈\s?A/i.test(s), color: "#3B82F6" },
  { match: (s) => /series\s?b|시리즈\s?B/i.test(s), color: "#8B5CF6" },
  { match: (s) => /series\s?c|시리즈\s?C/i.test(s), color: "#D946EF" },
  { match: (s) => /pre[\s-]?ipo|상장/i.test(s), color: "#F59E0B" },
  { match: (s) => /m&a|exit|엑시트/i.test(s), color: "#10B981" },
];

export function stageColor(stage: string): string {
  const s = stage.trim();
  for (const rule of STAGE_COLORS) {
    if (rule.match(s)) return rule.color;
  }
  return "#64748B";
}

export default function StageBadge({ stage, className = "" }: { stage?: string; className?: string }) {
  const s = (stage ?? "").trim();

  if (!s) {
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-secondary/60 ${className}`}>
        —
      </span>
    );
  }

  const color = stageColor(s);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
      style={{ backgroundColor: `${color}26`, color }}
    >
      {s}
    </span>
  );
}
