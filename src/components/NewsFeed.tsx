import { CompanyNewsItem } from "@/lib/newsAggregate";
import { CATEGORY_COLORS } from "@/lib/newsCategory";

function NewsCard({ companyName, item, category, score }: CompanyNewsItem) {
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
      className="block p-4 rounded-xl border border-edge bg-surface hover:bg-elevated hover:border-accent/40 transition-all hover:-translate-y-0.5"
    >
      {/* 기업명(굵은 텍스트, 주체) ↔ 카테고리/주요(알약) 위계 분리 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-primary truncate">{companyName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {score >= 8 && (
            <span className="inline-block text-[11px] font-medium text-[#FBBF24] bg-[#FBBF24]/15 px-2 py-0.5 rounded-full">
              주요
            </span>
          )}
          <span
            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${catColor}26`, color: catColor }}
          >
            {category}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-primary line-clamp-2 mb-1">{item.title}</p>
      <p className="text-xs text-secondary line-clamp-2 mb-2">{item.description}</p>
      <p className="text-xs text-secondary/60">{date}</p>
    </a>
  );
}

export default function NewsFeed({ news }: { news: CompanyNewsItem[] }) {
  if (news.length === 0) {
    return (
      <div className="rounded-xl border border-edge bg-surface p-6 text-sm text-secondary">
        관련 뉴스를 찾을 수 없습니다.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {news.map((n, i) => (
        <NewsCard key={`${n.companyId}-${i}`} {...n} />
      ))}
    </div>
  );
}
