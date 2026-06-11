import Link from "next/link";
import type { Company } from "@/lib/googleSheets";
import StageBadge from "@/components/ui/StageBadge";

// 투자유치 하이라이트 — investmentStage 보유 기업, 최근 투자일 순 (데이터 없으면 렌더 안 함)
export default function InvestmentHighlights({ companies }: { companies: Company[] }) {
  const staged = companies
    .filter((c) => c.investmentStage)
    .sort((a, b) => (b.lastInvestmentDate || "").localeCompare(a.lastInvestmentDate || ""))
    // 같은 기업 중복(연도별 행) 제거
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
    .slice(0, 8);

  if (staged.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-semibold text-primary mb-4">투자유치 하이라이트</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {staged.map((c) => (
          <Link
            key={c.id}
            href={`/companies/${encodeURIComponent(c.id)}`}
            className="shrink-0 w-52 rounded-xl border border-edge bg-surface p-4 flex flex-col gap-2.5 transition-all hover:bg-elevated hover:border-accent/40 hover:-translate-y-0.5"
          >
            <div className="flex items-center">
              <span className="font-semibold text-primary text-base truncate">{c.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StageBadge stage={c.investmentStage} />

            </div>
            {c.lastInvestmentDate && (
              <span className="text-xs text-secondary/60 tnum">{c.lastInvestmentDate}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
