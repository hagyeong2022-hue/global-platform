import { searchNews, NewsItem } from "@/lib/naverNews";
import { Company } from "@/lib/googleSheets";

type CompanyNews = {
  company: Company;
  item: NewsItem;
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

function calcScore(item: NewsItem): number {
  const text = item.title + " " + item.description;
  return SCORE_RULES.reduce((total, rule) => {
    const hit = rule.keywords.some((kw) => text.includes(kw));
    return total + (hit ? rule.score : 0);
  }, 0);
}

async function fetchCompanyNews(company: Company): Promise<CompanyNews | null> {
  try {
    const results = await searchNews(company.name, 1);
    if (results.length === 0) return null;
    const item = results[0];
    return { company, item, score: calcScore(item) };
  } catch {
    return null;
  }
}

function NewsCard({ company, item, score }: CompanyNews) {
  const date = new Date(item.pubDate).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <a
      href={item.originallink || item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {company.name}
        </span>
        {score >= 8 && (
          <span className="inline-block text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
            주요
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{item.title}</p>
      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.description}</p>
      <p className="text-xs text-gray-300">{date}</p>
    </a>
  );
}

export async function fetchAllCompanyNews(companies: Company[]): Promise<{ news: CompanyNews[]; total: number }> {
  if (companies.length === 0) return { news: [], total: 0 };
  const results = await Promise.all(companies.map(fetchCompanyNews));
  const all = results.filter((r): r is CompanyNews => r !== null);
  const news = all
    .sort((a, b) => b.score - a.score || new Date(b.item.pubDate).getTime() - new Date(a.item.pubDate).getTime())
    .slice(0, 6);
  return { news, total: all.length };
}

export default function NewsFeed({ news }: { news: CompanyNews[] }) {
  if (news.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">
        관련 뉴스를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((n, i) => (
          <NewsCard key={i} {...n} />
        ))}
      </div>
    </div>
  );
}
