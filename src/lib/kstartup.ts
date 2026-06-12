/**
 * K-Startup 창업지원포털 공고 API
 * 공공데이터포털(data.go.kr) → 창업진흥원_K-Startup 조회서비스
 * 서비스 ID: 15125364
 * API 키 발급: https://www.data.go.kr/data/15125364/openapi.do
 *
 * 환경변수:
 *   KSTARTUP_API_KEY  — 공공데이터포털 서비스키 (인증키)
 */

const API_BASE =
  process.env.KSTARTUP_API_BASE_URL ||
  "https://apis.data.go.kr/1130000/StartBizAnnouncementService/getAnnouncementList";

export type SupportAnnouncement = {
  id: string;
  title: string;
  org_name: string;
  category: string;
  apply_start: string | null; // "YYYY-MM-DD"
  apply_end: string | null;   // "YYYY-MM-DD"
  url: string;
  source: string;
};

function toIsoDate(raw: string | undefined): string | null {
  if (!raw) return null;
  // 공공API는 YYYYMMDD 또는 YYYY-MM-DD 형태로 옴
  const s = raw.replace(/\D/g, "");
  if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return null;
}

export async function fetchKstartupAnnouncements(
  pageNo = 1,
  numOfRows = 100
): Promise<SupportAnnouncement[]> {
  const key = process.env.KSTARTUP_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    serviceKey: key,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    type: "json",
  });

  const res = await fetch(`${API_BASE}?${params}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`K-Startup API ${res.status}`);

  const json = await res.json();

  // 공공데이터 표준 응답 구조 파싱
  const body = json?.response?.body ?? json?.body ?? json;
  const rawItems: unknown[] = Array.isArray(body?.items?.item)
    ? body.items.item
    : Array.isArray(body?.items)
    ? body.items
    : [];

  return rawItems.map((item: unknown) => {
    const it = item as Record<string, string>;

    // 공고명 — 필드명은 API 가이드 확인 후 조정
    const title =
      it["사업공고명"] ?? it["pbanc_nm"] ?? it["announcementName"] ?? it["title"] ?? "제목 없음";

    // 주관기관
    const org_name =
      it["주관기관"] ?? it["jrsd_inst_nm"] ?? it["institutionName"] ?? it["orgName"] ?? "";

    // 카테고리/지원유형
    const category =
      it["지원사업분류"] ?? it["bizType"] ?? it["supportType"] ?? it["category"] ?? "기타";

    // 날짜
    const apply_start = toIsoDate(
      it["모집시작일"] ?? it["rcept_bgng_de"] ?? it["applyStartDate"] ?? it["startDate"]
    );
    const apply_end = toIsoDate(
      it["모집마감일"] ?? it["rcept_end_de"] ?? it["applyEndDate"] ?? it["endDate"]
    );

    // 공고 URL
    const url =
      it["공고URL"] ?? it["pbanc_url"] ?? it["announcementUrl"] ?? it["detailUrl"] ??
      `https://www.k-startup.go.kr/web/contents/bizpbannouncementList.do`;

    // 고유 ID
    const id =
      it["공고번호"] ?? it["pbancNo"] ?? it["id"] ??
      `${title}-${apply_end ?? ""}`.replace(/\s/g, "-").slice(0, 80);

    return { id, title, org_name, category, apply_start, apply_end, url, source: "kstartup" };
  });
}

/** DB에서 캐시된 공고 목록 조회 */
import { getSupabaseAdmin } from "@/lib/supabase";

export async function getAnnouncementsFromCache(limit = 50): Promise<SupportAnnouncement[]> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("support_announcements")
    .select("*")
    .gte("apply_end", today)       // 마감 안 된 것만
    .order("apply_end", { ascending: true })
    .limit(limit);
  return (data ?? []) as SupportAnnouncement[];
}
