/**
 * 혁신의숲(InnoForest) API 연동 — 키는 관리자 설정(app_settings)에서 입력하면 무코드 활성화.
 *   - innoforest_enabled = "true" + innoforest_api_key 존재 시에만 실제 호출
 *   - 미설정이면 모든 함수가 null 반환 (에러로 터지지 않음)
 * 데이터 출처: devnext.innoforest.co.kr / 문의 support@innoforest.co.kr
 * 제공 항목(50+): 매출·손익, 고용, 투자이력, 방문자 등.
 * ⚠️ 실제 엔드포인트·응답 스키마는 키 발급 후 문서를 보고 채워야 함 (TODO).
 */
import { getSetting } from "@/lib/settings";

export type InnoforestCompany = {
  businessNumber: string;
  revenue?: { year: number; amountKRW: number }[];
  employment?: { month: string; count: number }[];
  investments?: { date: string; round: string; amountKRW?: number; investors?: string[] }[];
  raw?: unknown;
};

export async function isInnoforestEnabled(): Promise<boolean> {
  const enabled =
    (await getSetting("innoforest_enabled")) === "true" ||
    process.env.INNOFOREST_ENABLED === "true";
  const key = (await getSetting("innoforest_api_key")) || process.env.INNOFOREST_API_KEY;
  return enabled && !!key;
}

export async function fetchInnoforestCompany(businessNumber: string): Promise<InnoforestCompany | null> {
  if (!(await isInnoforestEnabled())) return null;
  const bizNum = businessNumber.replace(/\D/g, "");
  if (!bizNum) return null;

  const apiKey = (await getSetting("innoforest_api_key")) || process.env.INNOFOREST_API_KEY;
  const apiBase =
    (await getSetting("innoforest_api_base")) ||
    process.env.INNOFOREST_API_BASE ||
    "https://api.innoforest.co.kr";

  try {
    // TODO: 실제 엔드포인트·인증 방식은 키 발급 후 문서 확인하여 교체
    const res = await fetch(`${apiBase}/v1/companies/${bizNum}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const raw = await res.json();
    // TODO: raw → InnoforestCompany 매핑 (스키마 확정 후)
    return { businessNumber: bizNum, raw };
  } catch {
    return null;
  }
}
