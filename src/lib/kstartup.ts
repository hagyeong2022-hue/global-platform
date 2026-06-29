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
  "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01";

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

  // 신규 data.go.kr(/B552735) 스타일: page / perPage / returnType
  const params = new URLSearchParams({
    serviceKey: key,
    page: String(pageNo),
    perPage: String(numOfRows),
    returnType: "json",
  });

  const res = await fetch(`${API_BASE}?${params}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`K-Startup API ${res.status}`);

  const json = await res.json();
  const rawItems: unknown[] = Array.isArray(json?.data) ? json.data : [];

  return rawItems.map((item: unknown) => {
    const it = item as Record<string, string | number | null>;
    const s = (v: string | number | null | undefined) => (v == null ? undefined : String(v));

    const title = s(it["biz_pbanc_nm"]) ?? s(it["intg_pbanc_biz_nm"]) ?? "제목 없음";
    const org_name = s(it["pbanc_ntrp_nm"]) ?? s(it["sprv_inst"]) ?? "";
    const category = s(it["supt_biz_clsfc"]) ?? "기타";
    const apply_start = toIsoDate(s(it["pbanc_rcpt_bgng_dt"]));
    const apply_end = toIsoDate(s(it["pbanc_rcpt_end_dt"]));
    const url =
      s(it["detl_pg_url"]) ??
      s(it["biz_gdnc_url"]) ??
      "https://www.k-startup.go.kr/web/contents/bizpbannouncementList.do";
    const id =
      s(it["pbanc_sn"]) ??
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
