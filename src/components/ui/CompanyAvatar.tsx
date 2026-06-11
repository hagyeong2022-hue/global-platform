"use client";

import { useState } from "react";
import { hashColor } from "@/lib/hashColor";
import { autoLogoUrl } from "@/lib/companyLogo";

// 기업 아바타 — 로고가 있으면 이미지, 없으면 첫 글자 + 해시 컬러
// 우선순위: logoUrl(수동 업로드) → domain 기반 자동 로고 → 이니셜 폴백
const SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-xl",
};
const PX = { sm: 28, md: 36, lg: 56 };

export default function CompanyAvatar({
  name,
  size = "md",
  logoUrl,
  domain,
  className = "",
}: {
  name: string;
  size?: keyof typeof SIZES;
  logoUrl?: string;
  domain?: string;
  className?: string;
}) {
  const src = logoUrl || (domain ? autoLogoUrl(domain) : "");
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={PX[size]}
        height={PX[size]}
        loading="lazy"
        onError={() => setErrored(true)}
        className={`rounded-full object-contain bg-white shrink-0 ${SIZES[size]} ${className}`}
      />
    );
  }

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
