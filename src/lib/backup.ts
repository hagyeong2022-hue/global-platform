import { getSupabaseAdmin } from "@/lib/supabase";
import { getCompanies } from "@/lib/googleSheets";

// 스냅샷 보관 기간(일) — 이보다 오래된 백업은 정리
const RETENTION_DAYS = 90;

export type SnapshotMeta = {
  id: number;
  taken_at: string;
  source: string;
  row_count: number;
};

/**
 * 구글 시트 기업 데이터를 통째로 읽어 Supabase에 일일 스냅샷으로 저장.
 * data 컬럼(jsonb)에 Company[] 전체를 보관 → 추후 복원·비교(diff)에 사용.
 */
export async function createCompaniesSnapshot(): Promise<{ rowCount: number; takenAt: string }> {
  const companies = await getCompanies();
  const supabase = getSupabaseAdmin();
  const takenAt = new Date().toISOString();

  const { error } = await supabase.from("sheet_snapshots").insert({
    taken_at: takenAt,
    source: "companies",
    row_count: companies.length,
    data: companies,
  });
  if (error) throw new Error(`스냅샷 저장 실패: ${error.message}`);

  // 오래된 스냅샷 정리 (RETENTION_DAYS 초과)
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("sheet_snapshots").delete().lt("taken_at", cutoff);

  return { rowCount: companies.length, takenAt };
}

/** 최근 스냅샷 메타 목록 (복원 UI·운영 점검용, data 컬럼 제외) */
export async function listSnapshots(limit = 30): Promise<SnapshotMeta[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sheet_snapshots")
    .select("id, taken_at, source, row_count")
    .order("taken_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SnapshotMeta[];
}
