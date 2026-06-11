import { getCompanies } from "@/lib/googleSheets";
import { searchNews } from "@/lib/naverNews";
import IrPanel from "@/components/IrPanel";
import BookmarkStar from "@/components/BookmarkStar";
import CompanyAvatar from "@/components/ui/CompanyAvatar";
import StageBadge from "@/components/ui/StageBadge";
import CompanyNewsTabs from "@/components/CompanyNewsTabs";
import { countryFlag } from "@/lib/countryFlag";
import { formatKRW } from "@/lib/format";
import { resolveRevenue, resolveInvestment, SOURCE_LABEL, SOURCE_COLOR } from "@/lib/companyMetrics";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

/** 설립일 문자열에서 업력(년) 계산 — 파싱 실패 시 null */
function calcAge(establishedDate: string): string | null {
  const m = establishedDate.match(/(\d{4})[.\-/년\s]*(\d{1,2})?/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) - 1 : 0;
  if (year < 1900 || year > new Date().getFullYear()) return null;
  const diff = (Date.now() - new Date(year, month, 1).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (diff < 0) return null;
  return diff.toFixed(1);
}

/** 기업 개요 문장 자동 생성 — 빈 필드는 자연스럽게 생략 */
function buildOverview(c: {
  name: string; establishedDate: string; industry: string;
  programName: string; year: string; region: string; description: string;
}): string {
  const parts: string[] = [];
  const estYear = c.establishedDate.match(/\d{4}/)?.[0];

  let first = `${c.name}은(는)`;
  if (estYear) first += ` ${estYear}년에 설립된`;
  first += c.industry ? ` ${c.industry} 분야 스타트업으로,` : ` 스타트업으로,`;
  if (c.programName) {
    first += ` ${c.programName}(${c.year})을 통해`;
  } else {
    first += ` SBA 글로벌 프로그램(${c.year})을 통해`;
  }
  first += c.region ? ` ${c.region} 진출 지원을 받았습니다.` : ` 해외 진출 지원을 받았습니다.`;
  parts.push(first);

  if (c.description) parts.push(c.description);
  return parts.join(" ");
}

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

  // 함께 참여한 기업 — 같은 프로그램 + 같은 년도 (자기 제외, 기업명 중복 제거)
  const peers = companies
    .filter(
      (c) =>
        c.year === company.year &&
        c.programName === company.programName &&
        c.name.trim() !== normName
    )
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
    .slice(0, 9);

  const age = calcAge(company.establishedDate);
  const [news, revenue, investment] = await Promise.all([
    searchNews(company.name, 10).catch(() => []),
    resolveRevenue(company).catch(() => null),
    resolveInvestment(company).catch(() => null),
  ]);

  const infoGrid: { label: string; node: React.ReactNode }[] = [
    { label: "투자단계", node: <StageBadge stage={company.investmentStage} /> },
    { label: "업력", node: <span className="text-primary font-semibold tnum">{age ? `${age}년` : "—"}</span> },
    {
      label: "진출 국가",
      node: (
        <span className="text-primary font-semibold">
          {company.region ? `${countryFlag(company.region)} ${company.region}` : "—"}
        </span>
      ),
    },
    {
      label: "참여 프로그램",
      node: <span className="text-primary font-semibold tnum">{allEntries.length}회</span>,
    },
    {
      label: "매출",
      node: revenue ? (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-primary font-semibold tnum">{formatKRW(revenue.amountKRW)}원</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${SOURCE_COLOR[revenue.source]}26`, color: SOURCE_COLOR[revenue.source] }}
            title={revenue.fiscalYear ? `${revenue.fiscalYear} 회계연도` : undefined}
          >
            {SOURCE_LABEL[revenue.source]}
          </span>
        </span>
      ) : (
        <span className="text-secondary" title="DART 키 입력 시 자동 수집">—</span>
      ),
    },
    {
      label: "투자유치",
      node: investment ? (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-primary font-semibold tnum">{formatKRW(investment.amountKRW)}원</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${SOURCE_COLOR[investment.source]}26`, color: SOURCE_COLOR[investment.source] }}>{SOURCE_LABEL[investment.source]}</span>
        </span>
      ) : (
        <span className="text-secondary" title="혁신의숲 연동 시 표시">—</span>
      ),
    },
    {
      label: "고용인원",
      node: company.employment ? (
        <span className="text-primary font-semibold tnum">{company.employment}명</span>
      ) : (
        <span className="text-secondary">—</span>
      ),
    },
    { label: "대표자", node: <span className="text-primary font-semibold">{company.ceoName || "—"}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/startups" className="text-sm text-secondary hover:text-accent">
          ← 스타트업 탐색으로
        </Link>
      </div>

      {/* 헤더 */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <CompanyAvatar name={company.name} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-3 flex-wrap">
                {company.name}
                <StageBadge stage={company.investmentStage} />
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {company.region && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-soft text-accent">
                    {countryFlag(company.region)} {company.region}
                  </span>
                )}
                {company.industry && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-elevated text-secondary">
                    {company.industry}
                  </span>
                )}
                {company.isAi && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#A78BFA]/15 text-[#A78BFA]">
                    AI 분야
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <BookmarkStar companyName={company.name} />
            <IrPanel companyName={company.name} />
          </div>
        </div>

        {/* 기업 개요 문장 */}
        <p className="mt-5 text-sm leading-6 text-secondary border-t border-edge pt-4">
          {buildOverview(company)}
        </p>
      </div>

      {/* 주요 정보 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {infoGrid.map((item) => (
          <div key={item.label} className="rounded-xl border border-edge bg-surface px-5 py-4">
            <p className="text-xs text-secondary mb-1.5">{item.label}</p>
            {item.node}
          </div>
        ))}
      </div>

      {/* 프로그램 이력 */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <h2 className="text-sm font-semibold text-secondary uppercase mb-4">
          글로벌 진출 프로그램 이력 ({allEntries.length}회)
        </h2>
        <div className="flex flex-col gap-2">
          {allEntries
            .sort((a, b) => Number(b.year) - Number(a.year))
            .map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-edge bg-base/40"
              >
                <span className="font-semibold text-accent w-14 tnum">{e.year}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent whitespace-nowrap">
                  {countryFlag(e.region)} {e.region}
                </span>
                <span className="text-sm text-secondary truncate">{e.programName}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 연락처 */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <h2 className="text-sm font-semibold text-secondary uppercase mb-4">연락처</h2>
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

      {/* 뉴스 */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <h2 className="text-sm font-semibold text-secondary uppercase mb-4">최신 뉴스</h2>
        <CompanyNewsTabs news={news} />
      </div>

      {/* 함께 참여한 기업 */}
      {peers.length > 0 && (
        <div className="rounded-xl border border-edge bg-surface p-6">
          <h2 className="text-sm font-semibold text-secondary uppercase mb-4">
            함께 참여한 기업 — {company.programName} ({company.year})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {peers.map((p) => (
              <Link
                key={p.id}
                href={`/companies/${encodeURIComponent(p.id)}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-edge bg-base/40 hover:bg-elevated hover:border-accent/40 transition-colors"
              >
                <CompanyAvatar name={p.name} size="sm" />
                <span className="text-sm font-medium text-primary truncate flex-1">{p.name}</span>
                <StageBadge stage={p.investmentStage} />
              </Link>
            ))}
          </div>
        </div>
      )}
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
      <dt className="text-xs text-secondary/70 mb-1">{label}</dt>
      <dd className="text-sm text-primary">{value || "—"}</dd>
    </div>
  );
}
