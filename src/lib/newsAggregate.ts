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

// ── 관련성 필터 ─────────────────────────────────────────────
// 네이버 뉴스는 사명이 본문에 우연히 등장하기만 해도 검색되므로,
// 해당 기업/스타트업/경제와 무관한 기사(퀴즈·스포츠·연예 등)가 섞인다.

// 사명에서 떼어낼 법인 표기 (제목엔 보통 핵심 브랜드명만 나온다)
const CORP_RE = /주식회사|㈜|\(주\)|코퍼레이션|컴퍼니|corporation|incorporated|inc\.?|ltd\.?|co\.?/gi;

function coreName(s: string): string {
  return s.replace(CORP_RE, "").replace(/\s+/g, "").toLowerCase();
}

// 명백한 스팸·무관 기사 패턴 (공백 제거·소문자 기준)
const NOISE_PATTERNS = [
  "퀴즈", "정답", "돈버는", "오늘의운세", "운세", "로또", "복권", "경마",
  "별자리", "타로", "프로야구", "프로축구", "f1", "골프대회", "분양가", "청약일정",
];

// 경제·스타트업 관련성 키워드 — 제목에 사명이 없을 때 본문 맥락 판단용
const RELEVANCE_KEYWORDS = [
  "투자", "유치", "펀딩", "시리즈", "밸류", "기업가치", "ipo", "상장",
  "매출", "흑자", "영업이익", "순이익", "실적", "수익", "거래액",
  "수주", "계약", "공급", "납품", "수출", "조달",
  "인수", "합병", "m&a", "mou", "협약", "파트너십", "제휴",
  "법인", "설립", "출시", "런칭", "론칭", "선정", "수상", "인증", "특허",
  "스타트업", "창업", "벤처", "대표", "ceo", "서비스", "플랫폼", "솔루션",
  "글로벌", "해외", "진출", "확장", "성장", "사업", "개발", "기술", "혁신", "고용", "채용",
];

/** 이 기사가 해당 기업과 실제로 관련 있는지 판별 */
export function isRelevantNews(companyName: string, item: NewsItem): boolean {
  const core = coreName(companyName);
  if (core.length < 2) return true; // 너무 짧은 사명은 판별 불가 → 통과

  const titleN = (item.title ?? "").replace(/\s+/g, "").toLowerCase();
  const textN = `${item.title ?? ""} ${item.description ?? ""}`.replace(/\s+/g, "").toLowerCase();

  // 1) 사명이 제목·본문에 정확히 등장하지 않으면 오검색
  if (!textN.includes(core)) return false;
  // 2) 명백한 스팸/무관 기사 제거
  if (NOISE_PATTERNS.some((p) => textN.includes(p))) return false;
  // 3) 제목에 사명이 있으면 그 기업 기사 → 통과
  if (titleN.includes(core)) return true;
  // 4) 제목엔 없고 본문에만 있으면, 경제/스타트업 키워드가 있어야 통과
  return RELEVANCE_KEYWORDS.some((kw) => textN.includes(kw));
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
        return items
          .filter((item) => isRelevantNews(c.name, item))
          .map((item) => ({
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
