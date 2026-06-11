import { searchNews, NewsItem } from "@/lib/naverNews";
import { Company } from "@/lib/googleSheets";
import { categorizeNews, NewsCategory } from "@/lib/newsCategory";

export type CompanyNewsItem = {
  companyId: string;
  companyName: string;
  item: NewsItem;
  category: NewsCategory;
  score: number;
};

// 키워드별 중요도 점수 (매출·성장 연관성 기준)
const SCORE_RULES: { keywords: string[]; score: number }[] = [
  { keywords: ["투자유치", "시리즈A", "시리즈B", "시리즈C", "시리즈D", "프리IPO", "상장"], score: 10 },
  { keywords: ["투자", "유치", "펀딩", "밸류에이션", "기업가치"], score: 8 },
  { keywords: ["매출", "흑자", "영업이익", "순이익", "실적"], score: 8 },
  { keywords: ["수주", "계약", "공급", "납품"], score: 7 },
  { keywords: ["인수", "합병", "M&A"], score: 7 },
  { keywords: ["MOU", "업무협약", "파트너십", "전략적 제휴"], score: 5 },
  { keywords: ["법인 설립", "법인설립", "현지법인", "해외법인"], score: 5 },
  { keywords: ["글로벌", "해외진출", "수출", "진출"], score: 3 },
  { keywords: ["수상", "선정", "인증", "특허"], score: 2 },
  { keywords: ["출시", "런칭", "론칭", "오픈"], score: 1 },
];

export function calcScore(item: NewsItem): number {
  const text = item.title + " " + item.description;
  return SCORE_RULES.reduce((total, rule) => {
    const hit = rule.keywords.some((kw) => text.includes(kw));
    return total + (hit ? rule.score : 0);
  }, 0);
}

/**
 * 기업 목록의 뉴스를 병렬 수집해 평탄화 — naverNews 쪽 fetch가 24시간 캐시되므로
 * 기업 수만큼 호출돼도 하루 한 번만 실제 API를 탄다.
 */
export async function fetchCompaniesNews(
  companies: Company[],
  perCompany = 3
): Promise<CompanyNewsItem[]> {
  if (companies.length === 0) return [];

  const results = await Promise.all(
    companies.map(async (c) => {
      try {
        const items = await searchNews(c.name, perCompany);
        return items.map((item) => ({
          companyId: c.id,
          companyName: c.name,
          item,
          category: categorizeNews(item.title, item.description),
          score: calcScore(item),
        }));
      } catch {
        return [];
      }
    })
  );

  return results
    .flat()
    .sort((a, b) => new Date(b.item.pubDate).getTime() - new Date(a.item.pubDate).getTime());
}

/** YYYY-MM-DD (로컬 기준) */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
