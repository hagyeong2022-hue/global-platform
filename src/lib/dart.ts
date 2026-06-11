/**
 * DART OpenAPI (opendart.fss.or.kr) — 공식 재무제표 기반 매출 자동수집 (기본 소스).
 * 무료 키: 설정(app_settings.dart_api_key) 또는 env DART_API_KEY.
 * 한계: 상장·외부감사 대상 기업만 존재 — 비상장 소규모 스타트업은 없을 수 있음(→ null).
 * 키 없으면 모든 함수 null 반환 (에러로 터지지 않음).
 */
import AdmZip from "adm-zip";
import { getSetting } from "@/lib/settings";

async function getKey(): Promise<string | null> {
  return (await getSetting("dart_api_key")) || process.env.DART_API_KEY || null;
}

// corp_code 매핑 캐시 (정규화된 기업명 → corp_code). 프로세스 메모리, 24h.
let corpMap: Map<string, string> | null = null;
let corpMapAt = 0;
const CORP_TTL = 24 * 60 * 60 * 1000;

function normName(s: string): string {
  return s.replace(/\(주\)|주식회사|㈜|\s|,|\.|-/g, "").toLowerCase();
}

async function loadCorpMap(key: string): Promise<Map<string, string>> {
  if (corpMap && Date.now() - corpMapAt < CORP_TTL) return corpMap;
  const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${key}`);
  if (!res.ok) throw new Error(`corpCode ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  const xml = zip.getEntries()[0].getData().toString("utf-8");
  const map = new Map<string, string>();
  // <list><corp_code>..</corp_code><corp_name>..</corp_name>...</list>
  const re = /<corp_code>\s*(\d+)\s*<\/corp_code>\s*<corp_name>\s*([^<]*)\s*<\/corp_name>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const code = m[1].trim();
    const name = normName(m[2]);
    if (name && !map.has(name)) map.set(name, code);
  }
  corpMap = map;
  corpMapAt = Date.now();
  return map;
}

/** 기업명으로 매출(원) 조회. 회계연도 미지정 시 전년도. 실패/미존재 시 null */
export async function getDartRevenue(
  companyName: string,
  year?: number
): Promise<{ revenueKRW: number; fiscalYear: number; corpCode: string } | null> {
  const key = await getKey();
  if (!key) return null;
  const fy = year ?? new Date().getFullYear() - 1;

  try {
    const map = await loadCorpMap(key);
    const corpCode = map.get(normName(companyName));
    if (!corpCode) return null;

    const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${key}&corp_code=${corpCode}&bsns_year=${fy}&reprt_code=11011`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "000" || !Array.isArray(data.list)) return null;

    // 손익계산서 '매출액'(또는 영업수익) 당기금액
    const row =
      data.list.find((r: { account_nm?: string }) => r.account_nm?.replace(/\s/g, "") === "매출액") ||
      data.list.find((r: { account_nm?: string }) => r.account_nm?.includes("영업수익"));
    if (!row) return null;
    const amount = Number(String(row.thstrm_amount ?? "").replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount === 0) return null;

    return { revenueKRW: amount, fiscalYear: fy, corpCode };
  } catch {
    return null;
  }
}
