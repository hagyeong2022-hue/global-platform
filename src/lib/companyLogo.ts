import type { Company } from "@/lib/googleSheets";

// 개인 메일 도메인 — 기업 로고로 쓸 수 없으므로 제외 (→ 이니셜 폴백)
const GENERIC_DOMAINS = new Set([
  "gmail.com", "naver.com", "daum.net", "hanmail.net", "kakao.com", "kakaocorp.com",
  "nate.com", "outlook.com", "hotmail.com", "yahoo.com", "yahoo.co.kr", "icloud.com",
  "me.com", "protonmail.com", "googlemail.com",
]);

/** 기업 이메일(대표→담당자 순)에서 회사 도메인 추출. 개인 메일·없으면 "" */
export function emailDomain(c: Pick<Company, "ceoEmail" | "managerEmail">): string {
  const email = (c.ceoEmail || c.managerEmail || "").trim();
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  const domain = email.slice(at + 1).toLowerCase().trim().replace(/[>,;].*$/, "");
  if (!domain || !domain.includes(".") || GENERIC_DOMAINS.has(domain)) return "";
  return domain;
}

/**
 * 도메인 기반 자동 로고 URL (Clearbit). 로고가 없으면 404 → <img onError>로 이니셜 폴백.
 * 키 불필요·무료. 서비스 불가 시에도 폴백되므로 화면은 안전.
 */
export function autoLogoUrl(domain: string): string {
  return domain ? `https://logo.clearbit.com/${domain}` : "";
}
