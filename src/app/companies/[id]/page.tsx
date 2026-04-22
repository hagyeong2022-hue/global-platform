import { getCompanies } from "@/lib/googleSheets";
import { searchNews } from "@/lib/naverNews";
import IrPanel from "@/components/IrPanel";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const companies = await getCompanies().catch(() => []);
  const company = companies.find((c) => c.id === decodedId);

  if (!company) notFound();

  const normName = company.name.trim();
  const normBizNum = company.businessNumber?.trim();
  const allEntries = companies.filter((c) => {
    if (c.name.trim() === normName) return true;
    if (normBizNum && c.businessNumber?.trim() === normBizNum) return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">
          ← 대시보드로
        </Link>
      </div>

      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{company.description}</p>
          </div>
          <IrPanel companyName={company.name} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {company.region}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {company.industry}
          </span>
          {company.isAi && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              AI 분야
            </span>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">기본 정보</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <InfoRow label="대표자" value={company.ceoName} />
          <InfoRow label="대표자 연락처" value={company.ceoPhone} />
          <InfoRow label="대표자 이메일" value={company.ceoEmail} />
          <InfoRow label="사업자등록번호" value={company.businessNumber} />
          <InfoRow label="설립일" value={company.establishedDate} />
          <InfoRow label="담당자" value={company.managerName} />
          <InfoRow label="담당자 이메일" value={company.managerEmail} />
          <InfoRow label="담당자 연락처" value={company.managerPhone} />
          <InfoRow label="소재지" value={company.address} className="sm:col-span-2" />
        </dl>
      </div>

      {/* 프로그램 이력 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
          글로벌 진출 프로그램 이력 ({allEntries.length}회)
        </h2>
        <div className="flex flex-col gap-2">
          {allEntries
            .sort((a, b) => Number(b.year) - Number(a.year))
            .map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <span className="font-semibold text-blue-600 w-16">{e.year}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 w-auto">
                  {e.region}
                </span>
                <span className="text-sm text-gray-600 truncate">{e.programName}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 매출액 자리 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">재무 정보</h2>
        <p className="text-sm text-gray-400">
          NICE / DART API 연동 예정 (6단계) — 매출액 자동 수집
        </p>
      </div>

      {/* 뉴스 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">최신 뉴스</h2>
        <CompanyNewsList companyName={company.name} />
      </div>
    </div>
  );
}

async function CompanyNewsList({ companyName }: { companyName: string }) {
  let news = [];
  try {
    news = await searchNews(companyName, 5);
  } catch {
    return <p className="text-sm text-gray-400">뉴스를 불러오지 못했습니다.</p>;
  }

  if (news.length === 0) {
    return <p className="text-sm text-gray-400">관련 뉴스가 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {news.map((item, i) => {
        const date = new Date(item.pubDate).toLocaleDateString("ko-KR", {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
        return (
          <a
            key={i}
            href={item.originallink || item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</p>
            <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
            <p className="text-xs text-gray-300">{date}</p>
          </a>
        );
      })}
    </div>
  );
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-gray-400 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}
