import { ReactNode } from "react";

// 공통 카드 — 기획서 §4-4. clickable이면 hover 시 elevated + 보더 밝아짐
export default function Card({
  children,
  clickable = false,
  className = "",
}: {
  children: ReactNode;
  clickable?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-edge bg-surface ${
        clickable
          ? "transition-all hover:bg-elevated hover:border-accent/40 hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
