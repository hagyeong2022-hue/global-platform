import { CompanyNewsItem } from "@/lib/newsAggregate";
import { CATEGORY_COLORS } from "@/lib/newsCategory";
import CompanyAvatar from "@/components/ui/CompanyAvatar";

type Meta = { domains?: Record<string, string>; logos?: Record<string, string> };

function NewsCard({ companyName, item, category, score, meta }: CompanyNewsItem & { meta: Meta }) {
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
      {/* 주체: 로고 + 기업명 (굵게) — 카테고리 태그와 위계 분리 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <CompanyAvatar name={companyName} logoUrl={meta.logos?.[companyName]} domain={meta.domains?.[companyName]} size="sm" />
          <span className="text-sm font-semibold text-primary truncate">{companyName}</span>
        </div>
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

export default function NewsFeed({
  news,
  domains = {},
  logos = {},
}: {
  news: CompanyNewsItem[];
  domains?: Record<string, string>;
  logos?: Record<string, string>;
}) {
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
        <NewsCard key={`${n.companyId}-${i}`} {...n} meta={{ domains, logos }} />
      ))}
    </div>
  );
}
