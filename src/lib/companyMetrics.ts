import type { Company } from "@/lib/googleSheets";
import { getCachedRevenue } from "@/lib/revenueCache";
import { fetchInnoforestCompany } from "@/lib/innoforest";

// 데이터 정책 (사용자 확정):
//  - 매출 = DART (공식 재무제표)만 사용. 시트 S열 무시.
//  - 투자 = 혁신의숲만 사용. 시트 T열 무시. (키 연결 전에는 null)
export type MetricSource = "dart" | "innoforest";
export type MetricResult = { amountKRW: number; source: MetricSource; fiscalYear?: number } | null;

export const SOURCE_LABEL: Record<MetricSource, string> = { dart: "DART", innoforest: "혁신의숲" };
export const SOURCE_COLOR: Record<MetricSource, string> = { dart: "#3B82F6", innoforest: "#34D399" };

/** 매출 — DART 캐시(revenue_cache)에서 빠르게 읽음. 미수집 시 null */
export async function resolveRevenue(company: Company): Promise<MetricResult> {
  const cached = await getCachedRevenue(company);
  if (cached) return { amountKRW: cached.revenueKRW, source: "dart", fiscalYear: cached.fiscalYear };
  return null;
}

/** 투자 — 혁신의숲만. 키 연결 전에는 null */
export async function resolveInvestment(company: Company): Promise<MetricResult> {
  const inno = await fetchInnoforestCompany(company.businessNumber).catch(() => null);
  if (inno?.investments?.length) {
    const total = inno.investments.reduce((a, i) => a + (i.amountKRW ?? 0), 0);
    if (total > 0) return { amountKRW: total, source: "innoforest" };
  }
  return null;
}
