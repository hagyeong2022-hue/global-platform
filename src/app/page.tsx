import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import NewsFeed from "@/components/NewsFeed";
import InvestmentHighlights from "@/components/InvestmentHighlights";
import { getCompanies } from "@/lib/googleSheets";
import { fetchCompaniesNews } from "@/lib/newsAggregate";
import { getNewsFromCache } from "@/lib/newsCache";
import { getRevenueAggregate } from "@/lib/revenueCache";
import { formatKRW } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const companies = await getCompanies().catch(() => []);

  const currentYear = String(new Date().getFullYear());
  const currentYearCompanies = companies.filter((c) => c.year === currentYear);
  const currentYearRegions = new Set(currentYearCompanies.map((c) => c.region).filter(Boolean));
  const allRegions = new Set(companies.map((c) => c.region).filter(Boolean));

  const currentYearNames = new Set(currentYearCompanies.map((c) => c.name));
  const cachedNews = await getNewsFromCache().catch(() => []);
  const news = cachedNews.length
    ? cachedNews.filter((n) => currentYearNames.has(n.companyName))
    : await fetchCompaniesNews(currentYearCompanies, 3).catch(() => []);
  const rev = await getRevenueAggregate().catch(() => ({ totalKRW: 0, companies: 0 }));

  // 이달의 뉴스 건수
  const now = new Date();
  const monthNews = news.filter((n) => {
    const d = new Date(n.item.pubDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // 오늘의 뉴스 피드 — 점수·최신순 상위 6개
  const topNews = [...news]
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.item.pubDate).getTime() - new Date(a.item.pubDate).getTime()
    )
    .filter((n, i, arr) => arr.findIndex((x) => x.companyName === n.companyName) === i)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8">

      {/* KPI 카드 4개 — 전체 너비 균등 분할 */}
      <section>
        <h2 className="section-header mb-4">주요 현황</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title={`올해 진출 지원 국가 (${currentYear})`}
            value={`${currentYearRegions.size}개국`}
            sub={`누적 ${allRegions.size}개국`}
            color="blue"
            href={`/programs?year=${currentYear}`}
          />
          <KpiCard
            title="관리 기업 수"
            value={`${companies.length.toLocaleString()}개사`}
            color="green"
            href="/startups"
          />
          <KpiCard
            title="매출 합산 (DART)"
            value={rev.totalKRW > 0 ? `${formatKRW(rev.totalKRW)}원` : "—"}
            sub={rev.totalKRW > 0 ? `DART 공시 ${rev.companies}개사` : "DART 집계 준비 중"}
            color="purple"
            href="/startups"
          />
          <KpiCard
            title="이달의 뉴스"
            value={`${monthNews.length}건`}
            sub={`${currentYear}년 기업 최신 뉴스`}
            color="orange"
            href="/news"
          />
        </div>
      </section>

      {/* 투자 하이라이트 */}
      <InvestmentHighlights companies={companies} />

      {/* 뉴스 + 바로가기 — 2컬럼 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 뉴스 피드 — 2/3 너비 */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">최신 뉴스</h2>
            <Link href="/news" className="text-xs text-accent hover:text-accent-hover transition-colors">
              전체 보기 →
            </Link>
          </div>
          <NewsFeed news={topNews} />
        </section>

        {/* 빠른 이동 — 1/3 너비 */}
        <aside className="flex flex-col gap-3">
          <h2 className="section-header mb-1">바로가기</h2>
          {[
            { href: "/startups", label: "스타트업 목록", sub: `전체 ${companies.length}개사`, icon: "👥" },
            { href: "/bookmarks", label: "관심기업", sub: "★ 즐겨찾기한 기업", icon: "⭐" },
            { href: "/programs", label: "프로그램 현황", sub: "연도별·국가별 현황", icon: "📅" },
            { href: "/news", label: "뉴스 아카이브", sub: "전체 뉴스 캘린더", icon: "📰" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-edge bg-surface hover:bg-elevated hover:border-accent/40 hover:-translate-y-0.5 transition-all"
            >
              <span className="text-2xl w-9 h-9 flex items-center justify-center bg-elevated rounded-lg shrink-0">
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">{item.label}</p>
                <p className="text-xs text-secondary mt-0.5">{item.sub}</p>
              </div>
              <span className="ml-auto text-secondary text-sm">→</span>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
