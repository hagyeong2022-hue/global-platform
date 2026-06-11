/** 시트의 백만원 단위 숫자 문자열 → 표시용 (예: "1234" → "12.3억", "50" → "5,000만원") */
export function formatMillionsKRW(raw: string): string {
  const n = Number(String(raw).replace(/[,\s원]/g, ""));
  if (!raw || isNaN(n) || n === 0) return "";
  if (n >= 10000) return `${(n / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}조`;
  if (n >= 100) return `${(n / 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`;
  return `${(n * 100).toLocaleString("ko-KR")}만원`;
}

/** 백만원 단위 문자열 합산 (숫자 아닌 값은 무시) */
export function sumMillions(values: string[]): number {
  return values.reduce((acc, v) => {
    const n = Number(String(v).replace(/[,\s원]/g, ""));
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
}
