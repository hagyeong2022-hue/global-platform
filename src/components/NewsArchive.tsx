"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CompanyNewsItem } from "@/lib/newsAggregate";
import { toDateKey } from "@/lib/newsAggregate";
import { NEWS_CATEGORIES, CATEGORY_COLORS, NewsCategory } from "@/lib/newsCategory";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateKey(key: string): Date | null {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export default function NewsArchive({ news }: { news: CompanyNewsItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date") ?? "";
  const categoryParam = (searchParams.get("category") ?? "") as NewsCategory | "";
  const companyParam = searchParams.get("company") ?? "";

  const selectedDate = dateParam ? parseDateKey(dateParam) : null;
  const weekAnchorParam = searchParams.get("week");
  const weekAnchor = weekAnchorParam ? parseDateKey(weekAnchorParam) : null;
  const weekStart = startOfWeek(weekAnchor ?? selectedDate ?? new Date());
  const todayKey = toDateKey(new Date());

  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      router.replace(`/news${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  function moveWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    updateParams((p) => {
      p.set("week", toDateKey(next));
      p.delete("date");
    });
  }

  // 주간 캘린더 데이터
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const key = toDateKey(date);
      const dayNews = news.filter((n) => toDateKey(new Date(n.item.pubDate)) === key);
      // 그날 등장한 뉴스 카테고리(투자/글로벌/수상/기타) — 정의된 순서 유지
      const cats = NEWS_CATEGORIES.filter((cat) => dayNews.some((n) => n.category === cat));
      return { date, key, count: dayNews.length, cats };
    });
  }, [news, weekStart]);

  // 기업 옵션
  const companyOptions = useMemo(
    () => Array.from(new Set(news.map((n) => n.companyName))).sort((a, b) => a.localeCompare(b, "ko")),
    [news]
  );

  // 필터링된 뉴스
  const filtered = useMemo(() => {
    return news.filter((n) => {
      if (dateParam && toDateKey(new Date(n.item.pubDate)) !== dateParam) return false;
      if (categoryParam && n.category !== categoryParam) return false;
      if (companyParam && n.companyName !== companyParam) return false;
      return true;
    });
  }, [news, dateParam, categoryParam, companyParam]);

  const counts = useMemo(() => {
    const base = news.filter((n) => {
      if (dateParam && toDateKey(new Date(n.item.pubDate)) !== dateParam) return false;
      if (companyParam && n.companyName !== companyParam) return false;
      return true;
    });
    const map = new Map<string, number>();
    for (const n of base) map.set(n.category, (map.get(n.category) ?? 0) + 1);
    return { total: base.length, byCategory: map };
  }, [news, dateParam, companyParam]);

  const weekLabel = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 주`;

  return (
    <div className="flex flex-col gap-5">
      {/* 주간 캘린더 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => moveWeek(-1)}
            className="px-3 py-1.5 rounded-lg border border-edge text-sm text-secondary hover:bg-elevated hover:text-primary transition-colors"
          >
            ← 이전 주
          </button>
          <span className="text-sm font-medium text-primary tnum">{weekLabel}</span>
          <button
            onClick={() => moveWeek(1)}
            className="px-3 py-1.5 rounded-lg border border-edge text-sm text-secondary hover:bg-elevated hover:text-primary transition-colors"
          >
            다음 주 →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const isToday = d.key === todayKey;
            const isSelected = d.key === dateParam;
            const isWeekend = i >= 5;
            return (
              <button
                key={d.key}
                onClick={() =>
                  updateParams((p) => {
                    if (isSelected) p.delete("date");
                    else p.set("date", d.key);
                  })
                }
                className={`rounded-xl border overflow-hidden min-h-[104px] text-left transition-all ${
                  isSelected
                    ? "border-accent ring-1 ring-accent bg-accent-soft"
                    : isToday
                    ? "border-accent/50 bg-surface"
                    : "border-edge bg-surface hover:bg-elevated"
                }`}
              >
                {/* 상단: 요일 + 날짜 (구분된 헤더 바) */}
                <div className={`flex items-baseline justify-between px-2.5 py-1.5 border-b ${
                  isSelected ? "border-accent/40" : "border-edge/70"
                }`}>
                  <span className={`text-[11px] font-medium ${
                    isSelected || isToday ? "text-accent" : isWeekend ? "text-secondary/60" : "text-secondary"
                  }`}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className="flex items-baseline gap-0.5">
                    <span className={`text-base font-semibold tnum ${
                      isSelected || isToday ? "text-accent" : "text-primary"
                    }`}>
                      {d.date.getDate()}
                    </span>
                    <span className="text-[10px] text-secondary/70">일</span>
                  </span>
                </div>

                {/* 하단: 뉴스 건수 + 카테고리 점 */}
                <div className="px-2.5 py-2 flex flex-col gap-1.5">
                  {d.count > 0 ? (
                    <span className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold tnum text-primary leading-none">{d.count}</span>
                      <span className="text-[11px] font-medium text-secondary">건</span>
                    </span>
                  ) : (
                    <span className="text-xs text-secondary/40">뉴스 없음</span>
                  )}
                  {d.cats.length > 0 && (
                    <span className="flex gap-1">
                      {d.cats.map((cat) => (
                        <span
                          key={cat}
                          title={cat}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 카테고리 색상 범례 */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-secondary px-1">
          <span className="opacity-70">색상:</span>
          {NEWS_CATEGORIES.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* 필터: 카테고리 탭 + 기업 선택 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {(["", ...NEWS_CATEGORIES] as const).map((cat) => {
            const label = cat === "" ? "전체" : cat;
            const count = cat === "" ? counts.total : counts.byCategory.get(cat) ?? 0;
            const active = categoryParam === cat;
            return (
              <button
                key={label}
                onClick={() =>
                  updateParams((p) => {
                    if (cat === "") p.delete("category");
                    else p.set("category", cat);
                  })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "border border-edge text-secondary hover:text-primary hover:bg-elevated"
                }`}
              >
                {label} <span className="opacity-60 tnum">{count}</span>
              </button>
            );
          })}
        </div>

        <select
          value={companyParam}
          onChange={(e) =>
            updateParams((p) => {
              if (!e.target.value) p.delete("company");
              else p.set("company", e.target.value);
            })
          }
          className="px-3 py-1.5 rounded-lg border border-edge bg-surface text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <option value="">모든 기업</option>
          {companyOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* 활성 필터 표시 */}
      {(dateParam || categoryParam || companyParam) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-secondary">필터:</span>
          {dateParam && <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent tnum">{dateParam}</span>}
          {categoryParam && <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent">{categoryParam}</span>}
          {companyParam && <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent">{companyParam}</span>}
          <button
            onClick={() => router.replace("/news", { scroll: false })}
            className="text-secondary hover:text-primary underline underline-offset-2"
          >
            전체 해제
          </button>
        </div>
      )}

      {/* 뉴스 리스트 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-10 text-center text-sm text-secondary">
          {dateParam || categoryParam || companyParam
            ? "조건에 맞는 뉴스가 없습니다."
            : "수집된 뉴스가 없습니다."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-secondary">
            <span className="text-primary font-semibold tnum">{filtered.length}</span>건의 뉴스
          </p>
          {filtered.map((n, i) => {
            const date = new Date(n.item.pubDate).toLocaleDateString("ko-KR", {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            });
            const catColor = CATEGORY_COLORS[n.category];
            return (
              <a
                key={`${n.companyId}-${i}`}
                href={n.item.originallink || n.item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 p-4 rounded-xl border border-edge bg-surface hover:bg-elevated hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateParams((p) => p.set("company", n.companyName));
                    }}
                    className="inline-block text-xs font-medium text-accent bg-accent-soft px-2 py-0.5 rounded-full hover:opacity-80"
                  >
                    {n.companyName}
                  </button>
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${catColor}26`, color: catColor }}
                  >
                    {n.category}
                  </span>
                  <span className="text-xs text-secondary/60 tnum ml-auto">{date}</span>
                </div>
                <p className="text-sm font-medium text-primary line-clamp-2">{n.item.title}</p>
                <p className="text-xs text-secondary line-clamp-2">{n.item.description}</p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
