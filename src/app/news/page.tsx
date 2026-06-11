import { Suspense } from "react";
import { getCompanies } from "@/lib/googleSheets";
import { fetchCompaniesNews } from "@/lib/newsAggregate";
import NewsArchive from "@/components/NewsArchive";

export const revalidate = 300;

export default async function NewsPage() {
  const companies = await getCompanies().catch(() => []);

  // 최근 2개 년도 기업 뉴스 수집 (네이버 호출은 기업당 24시간 캐시)
  const years = Array.from(new Set(companies.map((c) => c.year).filter(Boolean)))
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 2);
  const targets = companies.filter((c) => years.includes(c.year));
  // 같은 기업 중복 행 제거 후 수집
  const unique = targets.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);
  const news = await fetchCompaniesNews(unique, 5).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">뉴스</h1>
        <p className="text-sm text-secondary mt-1">
          {years.join("·")}년 참여 기업의 최신 뉴스 아카이브
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-secondary">불러오는 중…</div>}>
        <NewsArchive news={news} />
      </Suspense>
    </div>
  );
}
