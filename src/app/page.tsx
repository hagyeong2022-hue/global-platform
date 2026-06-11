import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import NewsFeed from "@/components/NewsFeed";
import NewsCalendar from "@/components/NewsCalendar";
import InvestmentHighlights from "@/components/InvestmentHighlights";
import { getCompanies } from "@/lib/googleSheets";
import { fetchCompaniesNews } from "@/lib/newsAggregate";
import { formatKRW, sumWon } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const companies = await getCompanies().catch(() => []);

  const currentYear = String(new Date().getFullYear());
  const currentYearCompanies = companies.filter((c) => c.year === currentYear);
  const currentYearRegions = new Set(currentYearCompanies.map((c) => c.region).filter(Boolean));
  const allRegions = new Set(companies.map((c) => c.region).filter(Boolean));

  const news = await fetchCompaniesNews(currentYearCompanies, 3).catch(() => []);

  // 매출 합산 — 시트 제출 수치(원 단위). 기업이 여러 해 참가하므로 기업별 최신 1건만 합산
  const latestRevByCompany = new Map<string, (typeof companies)[number]>();
  for (const c of companies) {
    if (!c.revenue) continue;
    const prev = latestRevByCompany.get(c.name);
    if (!prev || Number(c.year) > Number(prev.year)) latestRevByCompany.set(c.name, c);
  }
  const revenueWon = sumWon([...latestRevByCompany.values()].map((c) => c.revenue));

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
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">주요 현황</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title={`올해 진출 지원 국가 (${currentYear})`}
            value={`${currentYearRegions.size}개국`}
            sub={`누적 ${allRegions.size}개국`}
            color="blue"
            href={`/startups?year=${currentYear}`}
          />
          <KpiCard
            title="관리 기업 수"
            value={`${companies.length.toLocaleString()}개사`}
            color="green"
            href="/startups"
          />
          <KpiCard
            title="매출 합산"
            value={revenueWon > 0 ? `${formatKRW(revenueWon)}원` : "—"}
            sub={revenueWon > 0 ? `참여기업 제출 매출 (${latestRevByCompany.size}개사)` : "NICE / DART 연동 예정"}
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

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-primary">이번 주 뉴스</h2>
          <Link href="/news" className="text-xs text-secondary hover:text-accent">
            전체 보기 →
          </Link>
        </div>
        <NewsCalendar news={news} />
      </section>

      <InvestmentHighlights companies={companies} />

      <section>
        <h2 className="text-base font-semibold text-primary mb-4">오늘의 뉴스</h2>
        <NewsFeed news={topNews} />
      </section>

      <section className="flex justify-center pb-4">
        <Link
          href="/startups"
          className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          스타트업 전체 보기 →
        </Link>
      </section>
    </div>
  );
}
