// 뉴스 카테고리 휴리스틱 분류 — 제목·요약 키워드 기반 (내부용 정확도 수용)
export type NewsCategory = "투자" | "글로벌" | "수상" | "기타";

export const NEWS_CATEGORIES: NewsCategory[] = ["투자", "글로벌", "수상", "기타"];

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  투자: "#3B82F6",
  글로벌: "#10B981",
  수상: "#F59E0B",
  기타: "#64748B",
};

const RULES: { category: NewsCategory; keywords: string[] }[] = [
  {
    category: "투자",
    keywords: ["투자", "유치", "펀딩", "라운드", "시리즈", "밸류에이션", "기업가치", "IPO", "상장", "인수", "합병", "M&A"],
  },
  {
    category: "수상",
    keywords: ["수상", "선정", "인증", "어워드", "대상", "최우수", "우수상", "표창"],
  },
  {
    category: "글로벌",
    keywords: ["해외", "글로벌", "진출", "수출", "현지", "북미", "유럽", "동남아", "법인 설립", "법인설립", "CES", "MWC"],
  },
];

export function categorizeNews(title: string, description = ""): NewsCategory {
  const text = title + " " + description;
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.category;
  }
  return "기타";
}
