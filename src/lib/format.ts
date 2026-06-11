// 시트의 매출(S)·투자(T) 값은 헤더가 "백만원"이지만 실제 입력은 원(raw) 단위로 혼재됨.
// → 원(raw KRW)으로 해석해 사람이 읽는 한국어 금액으로 변환한다.

const JO = 1_0000_0000_0000; // 10^12 (조)
const EOK = 1_0000_0000; // 10^8 (억)
const MAN = 1_0000; // 10^4 (만)

/** 숫자/문자(콤마·원·공백 포함) → 원 단위 정수. 비숫자·빈값은 0 */
export function parseWon(raw: string | number | undefined | null): number {
  if (raw == null) return 0;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[,\s원]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 원 단위 금액 → "1.7조" / "172억" / "700만" / "5,000". 0/빈값은 "" */
export function formatKRW(raw: string | number | undefined | null): string {
  const n = parseWon(raw);
  if (n === 0) return "";
  const opt = { maximumFractionDigits: 1 } as const;
  if (n >= JO) return `${(n / JO).toLocaleString("ko-KR", opt)}조`;
  if (n >= EOK) return `${(n / EOK).toLocaleString("ko-KR", opt)}억`;
  if (n >= MAN) return `${Math.round(n / MAN).toLocaleString("ko-KR")}만`;
  return n.toLocaleString("ko-KR");
}

/** 원 단위 값들의 합 (비숫자 무시) */
export function sumWon(values: (string | number | undefined | null)[]): number {
  return values.reduce<number>((acc, v) => acc + parseWon(v), 0);
}

/** 시트의 '백만원' 단위 값 → 원. (헤더 기준; 단 입력 불일치 행은 부정확할 수 있음) */
export function millionWonToWon(raw: string | number | undefined | null): number {
  return parseWon(raw) * 1_000_000;
}
