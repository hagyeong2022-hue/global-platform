import type { Company } from "@/lib/googleSheets";
import { parseWon } from "@/lib/format";
import { getDartRevenue } from "@/lib/dart";
import { fetchInnoforestCompany } from "@/lib/innoforest";

// 데이터 소스 우선순위: 수동(시트/관리자) > 혁신의숲 > DART(기본). 중복 없이 한 값만 채택 + 출처 표시.
export type MetricSource = "manual" | "innoforest" | "dart";
export type RevenueResult = { amountKRW: number; source: MetricSource; fiscalYear?: number } | null;

export const SOURCE_LABEL: Record<MetricSource, string> = {
  manual: "수동 입력",
  innoforest: "혁신의숲",
  dart: "DART",
};
export const SOURCE_COLOR: Record<MetricSource, string> = {
  manual: "#94A3B8",
  innoforest: "#34D399",
  dart: "#3B82F6",
};

export async function resolveRevenue(company: Company): Promise<RevenueResult> {
  // 1) 수동(시트) 값 최우선
  const manual = parseWon(company.revenue);
  if (manual > 0) return { amountKRW: manual, source: "manual" };

  // 2) 혁신의숲 (연결 시에만 — 미설정이면 즉시 null)
  const inno = await fetchInnoforestCompany(company.businessNumber).catch(() => null);
  if (inno?.revenue?.length) {
    const latest = [...inno.revenue].sort((a, b) => b.year - a.year)[0];
    if (latest && latest.amountKRW > 0)
      return { amountKRW: latest.amountKRW, source: "innoforest", fiscalYear: latest.year };
  }

  // 3) DART (기본 자동수집 — 키 없으면 즉시 null)
  const dart = await getDartRevenue(company.name).catch(() => null);
  if (dart) return { amountKRW: dart.revenueKRW, source: "dart", fiscalYear: dart.fiscalYear };

  return null;
}
