import { hashColor } from "@/lib/hashColor";

// 기업 이니셜 아바타 — 로고가 없으므로 첫 글자 + 기업명 해시 컬러
const SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-xl",
};

export default function CompanyAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const color = hashColor(name);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none ${SIZES[size]} ${className}`}
      style={{ backgroundColor: `${color}33`, color }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
