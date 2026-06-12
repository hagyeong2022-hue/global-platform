// 지원공고 리스트 — 주요 스타트업 지원 기관 공고 포털 링크
const ANNOUNCEMENTS = [
  {
    org: "K-Startup",
    label: "창업지원 공고",
    desc: "중소벤처기업부 창업지원포털",
    url: "https://www.k-startup.go.kr/web/contents/bizpbannouncementList.do",
    badge: "중기부",
    badgeColor: "#1A56DB",
  },
  {
    org: "창업진흥원",
    label: "지원사업 공모",
    desc: "KISED 창업·벤처 지원사업 공모",
    url: "https://www.kised.or.kr/board.es?mid=a10301000000&bid=0003",
    badge: "KISED",
    badgeColor: "#0E9E5A",
  },
  {
    org: "TIPS",
    label: "팁스 프로그램 공고",
    desc: "민간투자주도형 기술창업 지원",
    url: "https://www.jointips.or.kr/",
    badge: "TIPS",
    badgeColor: "#7C3AED",
  },
  {
    org: "중소기업진흥공단",
    label: "지원사업 안내",
    desc: "중진공 정책자금·수출지원 공고",
    url: "https://www.sbc.or.kr/",
    badge: "중진공",
    badgeColor: "#D97706",
  },
  {
    org: "서울산업진흥원",
    label: "SBA 지원사업",
    desc: "서울시 스타트업 육성·글로벌 사업",
    url: "https://www.sba.seoul.kr/pages/main",
    badge: "SBA",
    badgeColor: "#DC2626",
  },
  {
    org: "기술보증기금",
    label: "보증·투자 공고",
    desc: "KIBO 기술금융·스타트업 지원",
    url: "https://www.kibo.or.kr/",
    badge: "KIBO",
    badgeColor: "#0891B2",
  },
];

export default function SupportAnnouncements() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">지원공고</h2>
        <span className="label-xs">주요 기관 바로가기</span>
      </div>

      <div className="border border-edge rounded-xl bg-surface overflow-hidden">
        {/* 헤더 행 */}
        <div className="grid grid-cols-[2fr_3fr_1fr] gap-4 px-4 py-2.5 bg-elevated border-b border-edge">
          <span className="label-xs">기관</span>
          <span className="label-xs">내용</span>
          <span className="label-xs text-right">바로가기</span>
        </div>

        {/* 공고 행 */}
        {ANNOUNCEMENTS.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grid grid-cols-[2fr_3fr_1fr] gap-4 items-center px-4 py-3.5 border-b border-edge last:border-0 hover:bg-elevated transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 text-white"
                style={{ backgroundColor: a.badgeColor }}
              >
                {a.badge}
              </span>
              <span className="text-sm font-semibold text-primary truncate">{a.org}</span>
            </div>
            <div>
              <p className="text-sm text-primary font-medium group-hover:text-accent transition-colors">
                {a.label}
              </p>
              <p className="text-xs text-secondary mt-0.5">{a.desc}</p>
            </div>
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1 text-xs text-accent border border-accent/30 px-2.5 py-1 rounded-lg group-hover:bg-accent group-hover:text-white transition-colors">
                방문
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-xs text-secondary mt-2 px-1">
        * 각 기관 공식 사이트로 연결됩니다. 실제 공고는 해당 기관에서 확인해 주세요.
      </p>
    </section>
  );
}
