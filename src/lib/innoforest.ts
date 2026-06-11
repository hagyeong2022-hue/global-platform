/**
 * 혁신의숲(InnoForest) API 연동 — 스캐폴드(세팅만, 기본 비활성)
 *
 * ⚠️ 활성화 조건: 사용자가 명시적으로 켤 때까지 동작하지 않음.
 *   - 환경변수 INNOFOREST_ENABLED=true 그리고 INNOFOREST_API_KEY 존재 시에만 실제 호출
 *   - 둘 중 하나라도 없으면 모든 함수가 null 반환(에러로 터지지 않음)
 *
 * 데이터 출처: devnext.innoforest.co.kr / 문의 support@innoforest.co.kr
 * 제공 항목(50+): 매출·손익, 고용, 투자이력, 방문자 등. 엑셀 또는 API 제공.
 * → 실제 엔드포인트·응답 스키마는 API 키 발급 후 문서를 보고 채워야 함 (아래 TODO).
 */

const API_BASE = process.env.INNOFOREST_API_BASE || "https://api.innoforest.co.kr"; // TODO: 실제 base 확인
const API_KEY = process.env.INNOFOREST_API_KEY;

export type InnoforestCompany = {
  businessNumber: string;
  revenue?: { year: number; amountKRW: number }[];
  employment?: { month: string; count: number }[];
  investments?: { date: string; round: string; amountKRW?: number; investors?: string[] }[];
  raw?: unknown; // 원본 응답 보관(스키마 확정 전)
};

/** 활성화 여부 — 사용자가 명시적으로 켰고 키가 있을 때만 true */
export function isInnoforestEnabled(): boolean {
  return process.env.INNOFOREST_ENABLED === "true" && !!API_KEY;
}

/**
 * 사업자등록번호로 기업 성장분석 데이터 조회.
 * 비활성 상태면 null 반환 — 호출부는 항상 null 가능성을 처리할 것.
 */
export async function fetchInnoforestCompany(
  businessNumber: string
): Promise<InnoforestCompany | null> {
  if (!isInnoforestEnabled()) return null;

  const bizNum = businessNumber.replace(/\D/g, "");
  if (!bizNum) return null;

  try {
    // TODO: 실제 엔드포인트·인증 방식은 발급 후 문서 확인하여 교체
    const res = await fetch(`${API_BASE}/v1/companies/${bizNum}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 86400 }, // 하루 캐시
    });
    if (!res.ok) return null;
    const raw = await res.json();

    // TODO: raw → InnoforestCompany 매핑은 스키마 확정 후 작성
    return { businessNumber: bizNum, raw };
  } catch {
    return null;
  }
}
