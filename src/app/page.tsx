import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import NewsColumn from "@/components/NewsColumn";
import SupportAnnouncements from "@/components/SupportAnnouncements";
import { getAnnouncementsFromCache } from "@/lib/kstartup";
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
  const announcements = await getAnnouncementsFromCache(50).catch(() => []);
  const hasApiKey = !!process.env.KSTARTUP_API_KEY;

  // 이달의 뉴스 건수
  const now = new Date();
  const monthNews = news.filter((n) => {
    const d = new Date(n.item.pubDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // 최신뉴스 — 날짜 최신순 상위 8개 (기업 중복 제거)
  const latestNews = [...news]
    .sort((a, b) => new Date(b.item.pubDate).getTime() - new Date(a.item.pubDate).getTime())
    .filter((n, i, arr) => arr.findIndex((x) => x.companyName === n.companyName) === i)
    .slice(0, 8);

  // 투자유치뉴스 — category="투자" 최신순 상위 8개
  const investNews = [...news]
    .filter((n) => n.category === "투자")
    .sort((a, b) => new Date(b.item.pubDate).getTime() - new Date(a.item.pubDate).getTime())
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-8">

      {/* ── 주요 현황: KPI 4개 + THE VC 카드 ── */}
      <section>
        <h2 className="section-header mb-4">주요 현황</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
          {/* THE VC 외부 연동 카드 */}
          <a
            href="https://thevc.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-xl border border-edge bg-surface p-5 flex flex-col gap-1 overflow-hidden transition-all hover:shadow-sm hover:-translate-y-0.5 hover:border-[#1A1A2E]/30"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-[#1A1A2E]" />
            <p className="label-xs">투자 데이터베이스</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-[#1A1A2E]">THE VC</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" className="opacity-50 group-hover:opacity-100 transition-opacity">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
            <p className="text-xs text-secondary mt-1">스타트업 투자·IR 데이터</p>
            <span className="absolute right-4 bottom-3.5 text-xs text-[#1A1A2E] opacity-0 group-hover:opacity-70 transition-opacity">
              바로가기 →
            </span>
          </a>
        </div>
      </section>

      {/* ── 뉴스 1행 2열 ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header">뉴스</h2>
          <Link href="/news" className="text-xs text-accent hover:text-accent-hover transition-colors">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <NewsColumn
            title="최신 뉴스"
            news={latestNews}
            accentColor="#1A56DB"
            href="/news"
          />
          <NewsColumn
            title="투자유치 뉴스"
            news={investNews}
            accentColor="#3B82F6"
            href="/news?category=투자"
          />
        </div>
      </section>

      {/* ── 지원공고 ── */}
      <SupportAnnouncements announcements={announcements} hasApiKey={hasApiKey} />

    </div>
  );
}
