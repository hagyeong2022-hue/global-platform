import KpiCard from "@/components/KpiCard";
import CompanyTable from "@/components/CompanyTable";
import NewsFeed, { fetchAllCompanyNews } from "@/components/NewsFeed";
import { getCompanies } from "@/lib/googleSheets";

export const revalidate = 60;

export default async function Home() {
  const companies = await getCompanies().catch(() => []);

  const currentYear = String(new Date().getFullYear());
  const currentYearCompanies = companies.filter((c) => c.year === currentYear);
  const currentYearRegions = new Set(currentYearCompanies.map((c) => c.region).filter(Boolean));
  const allRegions = new Set(companies.map((c) => c.region).filter(Boolean));

  const { news, total: newsTotal } = await fetchAllCompanyNews(currentYearCompanies).catch(() => ({ news: [], total: 0 }));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">주요 현황</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title={`올해 진출 지원 국가 (${currentYear})`}
            value={`${currentYearRegions.size}개국`}
            sub={`누적 ${allRegions.size}개국`}
            color="blue"
          />
          <KpiCard
            title="관리 기업 수"
            value={`${companies.length.toLocaleString()}개사`}
            color="green"
          />
          <KpiCard
            title="당년도 매출액 합산"
            value="—"
            sub="NICE / DART 연동 예정 (6단계)"
            color="purple"
          />
          <KpiCard
            title="이달의 뉴스"
            value={`${newsTotal}건`}
            sub={`${currentYear}년 기업 최신 뉴스`}
            color="orange"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">오늘의 뉴스</h2>
        <NewsFeed news={news} />
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">기업 목록</h2>
          <p className="text-xs text-gray-400">총 {companies.length.toLocaleString()}개 기업</p>
        </div>
        <CompanyTable companies={companies} />
      </section>
    </div>
  );
}
