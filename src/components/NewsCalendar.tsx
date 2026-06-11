import Link from "next/link";
import { CompanyNewsItem, toDateKey } from "@/lib/newsAggregate";
import { hashColor } from "@/lib/hashColor";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** 주어진 날짜가 속한 주의 월요일 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 뉴스 요일 캘린더 — THE VC 홈 패턴 (이번 주 7칸, 건수 + 기업 도트)
export default function NewsCalendar({
  news,
  weekStart,
  linkBase = "/news",
}: {
  news: CompanyNewsItem[];
  weekStart?: Date;
  linkBase?: string;
}) {
  const monday = weekStart ?? startOfWeek(new Date());
  const todayKey = toDateKey(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = toDateKey(date);
    const dayNews = news.filter((n) => toDateKey(new Date(n.item.pubDate)) === key);
    const companies = Array.from(new Set(dayNews.map((n) => n.companyName))).slice(0, 4);
    return { date, key, count: dayNews.length, companies };
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const isToday = d.key === todayKey;
        return (
          <Link
            key={d.key}
            href={`${linkBase}?date=${d.key}`}
            className={`rounded-xl border p-3 flex flex-col gap-1.5 min-h-[92px] transition-all hover:-translate-y-0.5 ${
              isToday
                ? "border-accent/60 bg-accent-soft"
                : "border-edge bg-surface hover:bg-elevated hover:border-accent/30"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className={`text-xs font-medium ${isToday ? "text-accent" : "text-secondary"}`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`text-sm font-semibold tnum ${isToday ? "text-accent" : "text-primary"}`}>
                {d.date.getDate()}
              </span>
            </div>
            <span className={`text-lg font-bold tnum ${d.count > 0 ? "text-primary" : "text-secondary/40"}`}>
              {d.count > 0 ? d.count : "·"}
            </span>
            {d.companies.length > 0 && (
              <span className="flex gap-1 mt-auto">
                {d.companies.map((name) => (
                  <span
                    key={name}
                    title={name}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: hashColor(name) }}
                  />
                ))}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
