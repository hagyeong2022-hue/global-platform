import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "purple" | "orange";
  href?: string;
}

const STYLES = {
  blue:   { bar: "bg-accent",        val: "text-accent",       soft: "bg-accent-soft" },
  green:  { bar: "bg-positive",      val: "text-positive",     soft: "bg-[#16A34A]/8" },
  purple: { bar: "bg-[#7C3AED]",     val: "text-[#6D28D9]",    soft: "bg-[#7C3AED]/8" },
  orange: { bar: "bg-[#D97706]",     val: "text-[#D97706]",    soft: "bg-[#D97706]/8" },
};

export default function KpiCard({ title, value, sub, color = "blue", href }: KpiCardProps) {
  const s = STYLES[color];

  const inner = (
    <>
      {/* 상단 컬러 바 */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${s.bar}`} />

      <p className="text-xs font-medium text-secondary uppercase tracking-wide">{title}</p>
      <p className={`text-3xl font-bold tnum mt-1 ${s.val}`}>{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}

      {href && (
        <span className="absolute right-4 bottom-3.5 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          자세히 →
        </span>
      )}
    </>
  );

  const cls = `group relative rounded-xl border border-edge bg-surface p-5 pt-5 flex flex-col gap-0.5 overflow-hidden transition-all hover:shadow-sm hover:-translate-y-0.5`;

  if (href) {
    return <Link href={href} className={cls}>{inner}</Link>;
  }
  return <div className={cls}>{inner}</div>;
}
