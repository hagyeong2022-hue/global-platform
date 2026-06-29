import type { Company } from "@/lib/googleSheets";

/**
 * 동일 기업이 여러 국가·프로그램·연도로 지원받아 시트에 여러 행으로 들어온 경우,
 * 한 기업으로 합쳐 표시·집계하기 위한 병합 모델.
 *
 * - 스타트업 탐색 탭, 홈 상단 카드: 이 병합본(중복 제외) 기준으로 카운팅
 * - 글로벌 프로그램 현황: 원본 행(국가별 중복 포함) 기준 카운팅 → 병합하지 않음
 */
export type MergedCompany = Company & {
  regions: string[]; // 진출 국가 전체 (중복 제거)
  industries: string[]; // 분야 전체
  programs: string[]; // 프로그램 전체
  years: string[]; // 지원 연도 전체
  descriptions: string[]; // 아이템(설명) 전체
  rowCount: number; // 원본 행 수
};

/** 같은 기업으로 묶는 키 — 사업자번호 우선, 없으면 사명 */
export function companyKey(c: Company): string {
  const bn = (c.businessNumber ?? "").replace(/\D/g, "");
  if (bn.length >= 6) return `b:${bn}`;
  return `n:${(c.name ?? "").trim()}`;
}

const uniq = (vals: (string | undefined)[]) =>
  Array.from(new Set(vals.map((v) => (v ?? "").trim()).filter(Boolean)));

/** Company[] → 기업별 1건으로 병합 */
export function mergeCompanies(companies: Company[]): MergedCompany[] {
  const map = new Map<string, Company[]>();
  for (const c of companies) {
    const k = companyKey(c);
    const arr = map.get(k);
    if (arr) arr.push(c);
    else map.set(k, [c]);
  }

  return Array.from(map.values()).map((rows) => {
    // 대표 행: 투자단계·고용 등 단일값은 값이 채워진 행을 우선 선택
    const base = rows.find((r) => r.investmentStage) ?? rows[0];
    return {
      ...base,
      regions: uniq(rows.map((r) => r.region)),
      industries: uniq(rows.map((r) => r.industry)),
      programs: uniq(rows.map((r) => r.programName)),
      years: uniq(rows.map((r) => r.year)),
      descriptions: uniq(rows.map((r) => r.description)),
      rowCount: rows.length,
    };
  });
}

/** 중복 제외 기업 수 */
export function uniqueCompanyCount(companies: Company[]): number {
  const keys = new Set(companies.map(companyKey));
  return keys.size;
}
