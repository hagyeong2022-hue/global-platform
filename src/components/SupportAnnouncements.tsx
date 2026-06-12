import type { SupportAnnouncement } from "@/lib/kstartup";

function calcDDay(endDate: string | null): { label: string; urgent: boolean } {
  if (!endDate) return { label: "–", urgent: false };
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "마감", urgent: false };
  if (diff === 0) return { label: "D-0", urgent: true };
  if (diff <= 7) return { label: `D-${diff}`, urgent: true };
  return { label: `D-${diff}`, urgent: false };
}

function DDayBadge({ endDate }: { endDate: string | null }) {
  const { label, urgent } = calcDDay(endDate);
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[44px] px-2 py-0.5 rounded-full text-[11px] font-bold border ${
        label === "마감"
          ? "border-secondary/30 text-secondary bg-transparent"
          : urgent
          ? "border-[#DC2626]/50 text-[#DC2626] bg-[#DC2626]/8"
          : "border-accent/40 text-accent bg-accent-soft"
      }`}
    >
      {label}
    </span>
  );
}

interface Props {
  announcements: SupportAnnouncement[];
  hasApiKey: boolean;
}

export default function SupportAnnouncements({ announcements, hasApiKey }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">지원공고</h2>
        <a
          href="https://www.k-startup.go.kr/web/contents/bizpbannouncementList.do"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          K-Startup 전체보기 →
        </a>
      </div>

      {!hasApiKey ? (
        /* API 키 미설정 안내 */
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <p className="text-sm font-semibold text-primary mb-1">K-Startup API 키 설정 필요</p>
          <p className="text-xs text-secondary mb-4">
            공공데이터포털에서 무료로 발급받은 뒤 Vercel 환경변수에 등록하면 매일 자동 수집됩니다.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://www.data.go.kr/data/15125364/openapi.do"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
            >
              API 키 발급받기 (무료)
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <span className="text-xs text-secondary">→ 환경변수 KSTARTUP_API_KEY 에 입력</span>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-6 text-center text-sm text-secondary">
          수집된 공고가 없습니다. 매일 오전 8시에 자동 갱신됩니다.
        </div>
      ) : (
        <div className="border border-edge rounded-xl bg-surface overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-[80px_1fr_140px_100px] gap-4 px-5 py-2.5 bg-elevated border-b border-edge">
            <span className="label-xs">D-Day</span>
            <span className="label-xs">공고명 / 기관</span>
            <span className="label-xs">접수기간</span>
            <span className="label-xs text-right">분류</span>
          </div>

          {/* 공고 행 */}
          {announcements.map((a) => {
            const { label: dLabel, urgent } = calcDDay(a.apply_end);
            return (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[80px_1fr_140px_100px] gap-4 items-center px-5 py-4 border-b border-edge last:border-0 hover:bg-elevated transition-colors group"
              >
                {/* D-Day */}
                <div>
                  <DDayBadge endDate={a.apply_end} />
                </div>

                {/* 제목 + 기관 */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors line-clamp-1">
                    {a.title}
                  </p>
                  {a.org_name && (
                    <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary/40 shrink-0" />
                      {a.org_name}
                    </p>
                  )}
                </div>

                {/* 접수기간 */}
                <div className="text-xs text-secondary tnum">
                  {a.apply_start && <span>{a.apply_start.slice(5)}</span>}
                  {a.apply_start && a.apply_end && <span className="mx-1 opacity-40">~</span>}
                  {a.apply_end && (
                    <span className={urgent && dLabel !== "마감" ? "text-[#DC2626] font-semibold" : ""}>
                      {a.apply_end.slice(5)}
                    </span>
                  )}
                </div>

                {/* 분류 */}
                <div className="flex justify-end">
                  {a.category && (
                    <span className="text-[11px] text-secondary bg-elevated border border-edge px-2 py-0.5 rounded-full truncate max-w-[96px]">
                      {a.category}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
