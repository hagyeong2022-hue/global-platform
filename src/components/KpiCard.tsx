import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "purple" | "orange";
  href?: string;
}

const ACCENTS = {
  blue: "text-accent",
  green: "text-positive",
  purple: "text-[#6D28D9]",
  orange: "text-[#D97706]",
};

export default function KpiCard({ title, value, sub, color = "blue", href }: KpiCardProps) {
  const inner = (
    <>
      <p className="text-sm text-secondary">{title}</p>
      <p className={`text-[28px] leading-9 font-bold tnum ${ACCENTS[color]}`}>{value}</p>
      {sub && <p className="text-xs text-secondary/80 mt-1">{sub}</p>}
      {href && (
        <span className="absolute right-5 bottom-4 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          자세히 →
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group relative rounded-xl border border-edge bg-surface p-6 flex flex-col gap-1 transition-all hover:bg-elevated hover:border-accent/40 hover:-translate-y-0.5"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-6 flex flex-col gap-1 relative">
      {inner}
    </div>
  );
}
