"use client";

import { useMemo, useState } from "react";
import type { NewsItem } from "@/lib/naverNews";
import { categorizeNews, NewsCategory, NEWS_CATEGORIES, CATEGORY_COLORS } from "@/lib/newsCategory";

// 기업 상세 뉴스 — 카테고리 탭 + 건수 뱃지 (THE VC 패턴)
export default function CompanyNewsTabs({ news }: { news: NewsItem[] }) {
  const categorized = useMemo(
    () => news.map((item) => ({ item, category: categorizeNews(item.title, item.description) })),
    [news]
  );

  const [active, setActive] = useState<"전체" | NewsCategory>("전체");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of categorized) map.set(n.category, (map.get(n.category) ?? 0) + 1);
    return map;
  }, [categorized]);

  const visible = active === "전체" ? categorized : categorized.filter((n) => n.category === active);

  if (news.length === 0) {
    return <p className="text-sm text-secondary">관련 뉴스가 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 flex-wrap">
        {(["전체", ...NEWS_CATEGORIES] as const).map((cat) => {
          const count = cat === "전체" ? categorized.length : counts.get(cat) ?? 0;
          if (cat !== "전체" && count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active === cat
                  ? "bg-accent-soft text-accent"
                  : "border border-edge text-secondary hover:text-primary hover:bg-elevated"
              }`}
            >
              {cat} <span className="opacity-60 tnum">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {visible.map(({ item, category }, i) => {
          const date = new Date(item.pubDate).toLocaleDateString("ko-KR", {
            year: "numeric", month: "short", day: "numeric",
          });
          const catColor = CATEGORY_COLORS[category];
          return (
            <a
              key={i}
              href={item.originallink || item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-3.5 rounded-xl border border-edge bg-base/40 hover:bg-elevated hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: `${catColor}26`, color: catColor }}
                >
                  {category}
                </span>
                <span className="text-xs text-secondary/60 tnum">{date}</span>
              </div>
              <p className="text-sm font-medium text-primary line-clamp-2">{item.title}</p>
              <p className="text-xs text-secondary line-clamp-2">{item.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
