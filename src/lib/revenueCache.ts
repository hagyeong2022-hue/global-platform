import { getSupabaseAdmin } from "@/lib/supabase";
import { getDartRevenue } from "@/lib/dart";
import type { Company } from "@/lib/googleSheets";

// DART 매출을 revenue_cache에 모아두고, 화면은 캐시만 빠르게 읽는다 (요청마다 DART 호출 방지).
export type CachedRevenue = { revenueKRW: number; fiscalYear: number; source: string };

function bizKey(company: Company): string {
  return (company.businessNumber || "").replace(/\D/g, "") || `name:${company.name.trim()}`;
}

/** 단일 기업의 캐시된 매출 (최신 회계연도) */
export async function getCachedRevenue(company: Company): Promise<CachedRevenue | null> {
  const key = bizKey(company);
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("revenue_cache")
      .select("revenue_krw, fiscal_year, source")
      .eq("business_number", key)
      .order("fiscal_year", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data || data.revenue_krw == null) return null;
    return { revenueKRW: Number(data.revenue_krw), fiscalYear: data.fiscal_year, source: data.source };
  } catch {
    return null;
  }
}

/** 전체 캐시 매출 합 (홈 KPI용) — 기업 수 + 합계(원) */
export async function getRevenueAggregate(): Promise<{ totalKRW: number; companies: number }> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("revenue_cache")
      .select("business_number, revenue_krw, fiscal_year")
      .not("revenue_krw", "is", null);
    if (!data) return { totalKRW: 0, companies: 0 };
    // 기업별 최신 회계연도 1건만
    const latest = new Map<string, { rev: number; fy: number }>();
    for (const r of data) {
      const prev = latest.get(r.business_number);
      if (!prev || r.fiscal_year > prev.fy) latest.set(r.business_number, { rev: Number(r.revenue_krw), fy: r.fiscal_year });
    }
    let total = 0;
    for (const v of latest.values()) total += v.rev;
    return { totalKRW: total, companies: latest.size };
  } catch {
    return { totalKRW: 0, companies: 0 };
  }
}

/** 배치 갱신 — 각 기업 DART 조회 후 revenue_cache upsert. 동시성 제한. */
export async function refreshRevenueCache(
  companies: Company[],
  concurrency = 5
): Promise<{ updated: number; matched: number }> {
  const supabase = getSupabaseAdmin();
  // 기업명 중복 제거 (기업당 1회)
  const unique = companies.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);
  let matched = 0;
  let updated = 0;

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (c) => {
        const dart = await getDartRevenue(c.name).catch(() => null);
        if (!dart) return;
        matched++;
        const { error } = await supabase.from("revenue_cache").upsert(
          {
            business_number: bizKey(c),
            fiscal_year: dart.fiscalYear,
            revenue_krw: dart.revenueKRW,
            source: "dart",
            corp_code: dart.corpCode,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "business_number,fiscal_year" }
        );
        if (!error) updated++;
      })
    );
  }
  return { updated, matched };
}
