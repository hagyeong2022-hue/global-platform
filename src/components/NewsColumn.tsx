import type { CompanyNewsItem } from "@/lib/newsAggregate";
import { CATEGORY_COLORS } from "@/lib/newsCategory";

function NewsRowCard({ companyName, item, category, score }: CompanyNewsItem) {
  const date = new Date(item.pubDate).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const catColor = CATEGORY_COLORS[category];

  return (
    <a
      href={item.originallink || item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-0 hover:bg-elevated transition-colors group"
    >
      {/* 카테고리 컬러 라인 */}
      <div className="w-1 shrink-0 self-stretch rounded-l-sm" style={{ backgroundColor: catColor }} />

      <div className="flex-1 min-w-0 px-4 py-3.5">
        {/* 상단: 기업명 영역 — 배경으로 분리 */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white shrink-0"
            style={{ backgroundColor: catColor }}
          >
            {companyName}
          </span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0"
            style={{ borderColor: `${catColor}40`, color: catColor, backgroundColor: `${catColor}12` }}
          >
            {category}
          </span>
          {score >= 8 && (
            <span className="text-[10px] font-semibold text-[#B45309] bg-[#D97706]/12 px-2 py-0.5 rounded-full shrink-0">
              주요
            </span>
          )}
          <span className="text-[11px] text-secondary/60 tnum ml-auto shrink-0">{date}</span>
        </div>

        {/* 하단: 뉴스 제목 */}
        <p className="text-sm font-medium text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {item.title}
        </p>
      </div>
    </a>
  );
}

interface NewsColumnProps {
  title: string;
  news: CompanyNewsItem[];
  accentColor?: string;
  href?: string;
}

export default function NewsColumn({ title, news, accentColor = "#1A56DB", href }: NewsColumnProps) {
  return (
    <div className="flex flex-col border border-edge rounded-xl bg-surface overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-elevated/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          <span className="label-xs">{news.length}건</span>
        </div>
        {href && (
          <a href={href} className="text-xs text-accent hover:text-accent-hover transition-colors">
            전체 →
          </a>
        )}
      </div>

      {/* 뉴스 목록 */}
      {news.length === 0 ? (
        <div className="p-6 text-sm text-secondary text-center">수집된 뉴스가 없습니다.</div>
      ) : (
        <div className="divide-y divide-edge">
          {news.map((n, i) => (
            <NewsRowCard key={`${n.companyId}-${i}`} {...n} />
          ))}
        </div>
      )}
    </div>
  );
}
