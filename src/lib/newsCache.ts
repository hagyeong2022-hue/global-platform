import { getSupabaseAdmin } from "@/lib/supabase";
import { searchNews } from "@/lib/naverNews";
import type { Company } from "@/lib/googleSheets";
import { categorizeNews, NewsCategory } from "@/lib/newsCategory";
import { calcScore, CompanyNewsItem } from "@/lib/newsAggregate";

// 뉴스를 news_cache에 모아두고 화면은 DB만 읽는다 (첫 로딩 가속 + 네이버 호출 분산).

/** Cron/관리자: 기업 뉴스 일괄 수집 → upsert */
export async function collectNews(
  companies: Company[],
  perCompany = 5,
  concurrency = 6
): Promise<{ companies: number; inserted: number }> {
  const supabase = getSupabaseAdmin();
  const unique = companies.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);
  let inserted = 0;

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (c) => {
        let items;
        try {
          items = await searchNews(c.name, perCompany);
        } catch {
          return;
        }
        if (!items.length) return;
        const rows = items.map((it) => ({
          company_name: c.name,
          title: it.title,
          link: it.originallink || it.link,
          description: it.description,
          category: categorizeNews(it.title, it.description),
          pub_date: new Date(it.pubDate).toISOString(),
          collected_at: new Date().toISOString(),
        }));
        const { error, count } = await supabase
          .from("news_cache")
          .upsert(rows, { onConflict: "company_name,link", ignoreDuplicates: true, count: "exact" });
        if (!error) inserted += count ?? 0;
      })
    );
  }
  return { companies: unique.length, inserted };
}

/** 화면용: 캐시에서 최근 뉴스 읽어 CompanyNewsItem[]로 변환 */
export async function getNewsFromCache(limit = 500): Promise<CompanyNewsItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("news_cache")
      .select("company_name, title, link, description, category, pub_date")
      .order("pub_date", { ascending: false })
      .limit(limit);
    if (!data) return [];
    return data.map((r, i) => {
      const item = {
        title: r.title,
        link: r.link,
        originallink: r.link,
        description: r.description ?? "",
        pubDate: r.pub_date,
      };
      return {
        companyId: `${r.company_name}-${i}`,
        companyName: r.company_name,
        item,
        category: (r.category as NewsCategory) ?? categorizeNews(r.title, r.description ?? ""),
        score: calcScore(item),
      };
    });
  } catch {
    return [];
  }
}
