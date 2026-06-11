import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import NewsFeed from "@/components/NewsFeed";
import InvestmentHighlights from "@/components/InvestmentHighlights";
import { getCompanies } from "@/lib/googleSheets";
import { fetchCompaniesNews } from "@/lib/newsAggregate";
import { getRevenueAggregate } from "@/lib/revenueCache";
import { formatKRW } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const companies = await getCompanies().catch(() => []);

  const currentYear = String(new Date().getFullYear());
  const currentYearCompanies = companies.filter((c) => c.year === currentYear);
  const currentYearRegions = new Set(currentYearCompanies.map((c) => c.region).filter(Boolean));
  const allRegions = new Set(companies.map((c) => c.region).filter(Boolean));

  const news = await fetchCompaniesNews(currentYearCompanies, 3).catch(() => []);
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
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">주요 현황</h2>
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
