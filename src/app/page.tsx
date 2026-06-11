import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import NewsFeed from "@/components/NewsFeed";
import NewsCalendar from "@/components/NewsCalendar";
import InvestmentHighlights from "@/components/InvestmentHighlights";
import { getCompanies } from "@/lib/googleSheets";
import { fetchCompaniesNews } from "@/lib/newsAggregate";
import { formatMillionsKRW, sumMillions } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const companies = await getCompanies().catch(() => []);

  const currentYear = String(new Date().getFullYear());
  const currentYearCompanies = companies.filter((c) => c.year === currentYear);
  const currentYearRegions = new Set(currentYearCompanies.map((c) => c.region).filter(Boolean));
  const allRegions = new Set(companies.map((c) => c.region).filter(Boolean));

  const news = await fetchCompaniesNews(currentYearCompanies, 3).catch(() => []);

  // 당년도 매출 합산 — 시트 S열(백만원). 당년도 데이터 없으면 전체 누적으로 대체
  const currentRevenue = sumMillions(currentYearCompanies.map((c) => c.revenue));
  const totalRevenue = sumMillions(companies.map((c) => c.revenue));
  const revenueValue = currentRevenue > 0 ? currentRevenue : totalRevenue;
  const revenueLabel =
    currentRevenue > 0 ? `${currentYear}년 기업 제출수치 합산` : "전체 기업 제출수치 합산";

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
            title="매출액 합산"
            value={revenueValue > 0 ? `${formatMillionsKRW(String(revenueValue))}원` : "—"}
            sub={revenueValue > 0 ? revenueLabel : "NICE / DART 연동 예정"}
            color="purple"
            href={`/startups?year=${currentYear}`}
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
